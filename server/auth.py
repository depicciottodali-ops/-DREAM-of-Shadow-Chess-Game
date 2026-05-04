from functools import wraps
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app, request, jsonify, g
from werkzeug.security import check_password_hash, generate_password_hash


TOKEN_AGE_SECONDS = 60 * 60 * 24 * 14


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def create_token(user_id, username):
    return _serializer().dumps({"user_id": user_id, "username": username})


def parse_token(token):
    try:
        data = _serializer().loads(token, max_age=TOKEN_AGE_SECONDS)
        return data
    except (BadSignature, SignatureExpired):
        return None


def hash_password(password):
    return generate_password_hash(password)


def verify_password(password_hash, password):
    return check_password_hash(password_hash, password)


def get_bearer_token():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1].strip()
    return None


def optional_auth():
    token = get_bearer_token()
    g.current_user = None
    if token:
        payload = parse_token(token)
        if payload:
            g.current_user = payload


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()
        if not token:
            return jsonify({"error": "Missing bearer token."}), 401

        payload = parse_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token."}), 401

        g.current_user = payload
        return fn(*args, **kwargs)

    return wrapper
