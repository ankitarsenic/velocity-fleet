from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
)
from functools import wraps
from app.models import User
from app.extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401

    additional_claims = {
        'role': user.role.name if user.role else 'Viewer',
        'permissions': user.role.permissions if user.role and user.role.permissions else []
    }

    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': new_access_token}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

def requires_permission(permissions):
    # Convert single string to list for uniform handling
    if isinstance(permissions, str):
        permissions = [permissions]
        
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_permissions = claims.get('permissions', [])
            
            # Super Admin has '*'
            if "*" in user_permissions:
                return fn(*args, **kwargs)
                
            # 'read_only' allows access to any 'view_' or 'read_' permission requirement
            if "read_only" in user_permissions and any(p.startswith('read_') or p.startswith('view_') for p in permissions):
                return fn(*args, **kwargs)
                
            # Check if user has ANY of the required permissions
            if any(p in user_permissions for p in permissions):
                return fn(*args, **kwargs)
                
            return jsonify({'message': 'Forbidden: You lack the required permission to access this resource.'}), 403
            
        return wrapper
    return decorator
