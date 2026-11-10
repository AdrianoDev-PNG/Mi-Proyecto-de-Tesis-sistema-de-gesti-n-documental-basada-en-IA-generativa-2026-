# users/services/auth_service.py
import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from django.conf import settings

class AuthService:
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
        self.secret_key = settings.SECRET_KEY
        self.access_token_expire = timedelta(hours=1)
        self.refresh_token_expire = timedelta(days=7)
    
    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verifica la contraseña"""
        return self.hash_password(password) == hashed
    
    def create_access_token(self, user_id: str, username: str) -> str:
        """Crea un token JWT de acceso"""
        payload = {
            'user_id': user_id,
            'username': username,
            'type': 'access',
            'exp': datetime.utcnow() + self.access_token_expire,
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        return token
    
    def create_refresh_token(self, user_id: str, username: str) -> str:
        """Crea un token JWT de refresco"""
        payload = {
            'user_id': user_id,
            'username': username,
            'type': 'refresh',
            'exp': datetime.utcnow() + self.refresh_token_expire,
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica y decodifica un token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def login(self, username: str, password: str) -> Dict[str, Any]:
        try:
            result = self.supabase.table('users').select('*').eq('username', username).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Usuario no encontrado'
                }
            
            user = result.data[0]
            
            if not user.get('is_active', False):
                return {
                    'success': False,
                    'error': 'Usuario inactivo'
                }
            
            if not self.verify_password(password, user['password_hash']):
                return {
                    'success': False,
                    'error': 'Contraseña incorrecta'
                }
            
            self.supabase.table('users').update({
                'last_login': datetime.now().isoformat()
            }).eq('id', user['id']).execute()
            
            access_token = self.create_access_token(user['id'], user['username'])
            refresh_token = self.create_refresh_token(user['id'], user['username'])
            
            role = 'administrador' if user.get('is_admin', False) else user.get('role', 'usuario')
            
            return {
                'success': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user.get('full_name'),
                    'is_admin': user.get('is_admin', False),
                    'profile_picture_url': user.get('profile_picture_url'),
                    'role': role
                },
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer'
            }
        
        except Exception as e:
            print(f"Error en login: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        try:
            payload = self.verify_token(refresh_token)
            
            if not payload:
                return {
                    'success': False,
                    'error': 'Token inválido o expirado'
                }
            
            if payload.get('type') != 'refresh':
                return {
                    'success': False,
                    'error': 'Token no es de tipo refresh'
                }
            
            access_token = self.create_access_token(
                payload['user_id'],
                payload['username']
            )
            
            return {
                'success': True,
                'access_token': access_token,
                'token_type': 'Bearer'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_current_user(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = self.verify_token(token)
            
            if not payload:
                return None
            
            result = self.supabase.table('users').select('*').eq('id', payload['user_id']).execute()
            
            if not result.data:
                return None
            
            user = result.data[0]
            
            role = 'administrador' if user.get('is_admin', False) else user.get('role', 'usuario')
            
            return {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'full_name': user.get('full_name'),
                'is_admin': user.get('is_admin', False),
                'is_active': user.get('is_active', True),
                'profile_picture_url': user.get('profile_picture_url'),
                'role': role,
                'created_at': user.get('created_at'),
                'last_login': user.get('last_login')
            }
        
        except Exception as e:
            print(f"Error obteniendo usuario: {e}")
            return None
    
    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        role: str = 'usuario'
    ) -> Dict[str, Any]:
        """Crea un nuevo usuario (usuario o soporte)"""
        try:
            # Validar role
            if role not in ['usuario', 'soporte']:
                return {
                    'success': False,
                    'error': 'role debe ser "usuario" o "soporte"'
                }
            
            existing = self.supabase.table('users').select('id').eq('username', username).execute()
            if existing.data:
                return {
                    'success': False,
                    'error': 'Username ya existe'
                }
            
            existing_email = self.supabase.table('users').select('id').eq('email', email).execute()
            if existing_email.data:
                return {
                    'success': False,
                    'error': 'Email ya existe'
                }
            
            password_hash = self.hash_password(password)
            
            user_data = {
                'username': username,
                'email': email,
                'password_hash': password_hash,
                'full_name': full_name,
                'is_admin': False,
                'is_active': True,
                'role': role
            }
            
            result = self.supabase.table('users').insert(user_data).execute()
            user = result.data[0]
            
            return {
                'success': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user.get('full_name'),
                    'is_admin': user.get('is_admin', False),
                    'role': user.get('role', 'usuario')
                }
            }
        
        except Exception as e:
            print(f"Error creando usuario: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_profile_picture(self, user_id: str, picture_url: str) -> Dict[str, Any]:
        try:
            self.supabase.table('users').update({
                'profile_picture_url': picture_url
            }).eq('id', user_id).execute()
            
            return {
                'success': True,
                'profile_picture_url': picture_url
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_users(self, role: Optional[str] = None, include_inactive: bool = False) -> list:
        try:
            query = self.supabase.table('users').select('id, username, email, full_name, is_admin, is_active, role, created_at, last_login')
            
            if role:
                query = query.eq('role', role)
            else:
                query = query.eq('is_admin', False)
            
            if not include_inactive:
                query = query.eq('is_active', True)
            
            result = query.order('created_at', desc=True).execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"Error listando usuarios: {e}")
            return []
    
    def toggle_user_status(self, user_id: str) -> Dict[str, Any]:
        """Habilita/deshabilita un usuario"""
        try:
            result = self.supabase.table('users').select('is_active').eq('id', user_id).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Usuario no encontrado'
                }
            
            current_status = result.data[0]['is_active']
            new_status = not current_status
            
            self.supabase.table('users').update({
                'is_active': new_status
            }).eq('id', user_id).execute()
            
            return {
                'success': True,
                'is_active': new_status,
                'message': f"Usuario {'habilitado' if new_status else 'deshabilitado'} correctamente"
            }
        
        except Exception as e:
            print(f"Error actualizando estado del usuario: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def edit_user(
        self,
        user_id: str,
        username: Optional[str] = None,
        email: Optional[str] = None,
        full_name: Optional[str] = None,
        role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Edita los datos de un usuario"""
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Usuario no encontrado'
                }
            
            user = result.data[0]
            
            if username and username != user['username']:
                existing = self.supabase.table('users').select('id').eq('username', username).execute()
                if existing.data:
                    return {
                        'success': False,
                        'error': 'Username ya existe'
                    }
            
            if email and email != user['email']:
                existing = self.supabase.table('users').select('id').eq('email', email).execute()
                if existing.data:
                    return {
                        'success': False,
                        'error': 'Email ya existe'
                    }
            
            if role and role not in ['usuario', 'soporte']:
                return {
                    'success': False,
                    'error': 'role debe ser "usuario" o "soporte"'
                }
            
            update_data = {}
            if username:
                update_data['username'] = username
            if email:
                update_data['email'] = email
            if full_name:
                update_data['full_name'] = full_name
            if role:
                update_data['role'] = role
            
            if not update_data:
                return {
                    'success': False,
                    'error': 'No hay datos para actualizar'
                }
            
            self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            updated_result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            updated_user = updated_result.data[0]
            
            return {
                'success': True,
                'user': {
                    'id': updated_user['id'],
                    'username': updated_user['username'],
                    'email': updated_user['email'],
                    'full_name': updated_user.get('full_name'),
                    'is_admin': updated_user.get('is_admin', False),
                    'is_active': updated_user.get('is_active', True),
                    'role': updated_user.get('role', 'usuario')
                }
            }
        
        except Exception as e:
            print(f"Error editando usuario: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_user(self, user_id: str) -> Dict[str, Any]:
        """Elimina un usuario"""
        try:
            result = self.supabase.table('users').select('id, is_admin').eq('id', user_id).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Usuario no encontrado'
                }
            
            if result.data[0].get('is_admin'):
                return {
                    'success': False,
                    'error': 'No se pueden eliminar administradores'
                }
            
            self.supabase.table('users').delete().eq('id', user_id).execute()
            
            return {
                'success': True,
                'message': 'Usuario eliminado correctamente'
            }
        
        except Exception as e:
            print(f"Error eliminando usuario: {e}")
            return {
                'success': False,
                'error': str(e)
            }