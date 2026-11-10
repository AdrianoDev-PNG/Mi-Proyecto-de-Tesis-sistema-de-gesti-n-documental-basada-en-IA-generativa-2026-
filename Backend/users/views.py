# users/views.py
import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .services import AuthService

auth_service = AuthService()

def require_admin(func):
    def wrapper(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Autenticación requerida'
            }, status=401)
        
        token = auth_header.replace('Bearer ', '')
        current_user = auth_service.get_current_user(token)
        
        if not current_user or not current_user.get('is_admin'):
            return JsonResponse({
                'success': False,
                'error': 'Solo administradores pueden acceder a este recurso'
            }, status=403)
        
        return func(self, request, *args, **kwargs)
    return wrapper

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    
    def post(self, request):
        try:
            body = json.loads(request.body)
            username = body.get('username')
            password = body.get('password')
            
            if not username or not password:
                return JsonResponse({
                    'error': 'Username and password required'
                }, status=400)
            
            result = auth_service.login(username, password)
            
            if not result['success']:
                return JsonResponse({
                    'error': result['error']
                }, status=401)
            
            return JsonResponse(result)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class RefreshTokenView(View):
    
    def post(self, request):
        try:
            body = json.loads(request.body)
            refresh_token = body.get('refresh_token')
            
            if not refresh_token:
                return JsonResponse({
                    'error': 'refresh_token required'
                }, status=400)
            
            result = auth_service.refresh_access_token(refresh_token)
            
            if not result['success']:
                return JsonResponse({
                    'error': result['error']
                }, status=401)
            
            return JsonResponse(result)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class MeView(View):
    """Endpoint para obtener datos del usuario actual"""
    
    def get(self, request):
        try:
            auth_header = request.headers.get('Authorization', '')
            
            if not auth_header.startswith('Bearer '):
                return JsonResponse({
                    'error': 'Invalid authorization header'
                }, status=401)
            
            token = auth_header.replace('Bearer ', '')
            user = auth_service.get_current_user(token)
            
            if not user:
                return JsonResponse({
                    'error': 'Invalid or expired token'
                }, status=401)
            
            return JsonResponse({'user': user})
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class CreateUserView(View):
    
    @require_admin
    def post(self, request):
        try:
            body = json.loads(request.body)
            username = body.get('username')
            email = body.get('email')
            password = body.get('password')
            full_name = body.get('full_name')
            role = body.get('role', 'usuario')
            
            if not all([username, email, password]):
                return JsonResponse({
                    'success': False,
                    'error': 'username, email y password son requeridos'
                }, status=400)
            
            if role not in ['usuario', 'soporte']:
                return JsonResponse({
                    'success': False,
                    'error': 'role debe ser "usuario" o "soporte"'
                }, status=400)
            
            result = auth_service.create_user(
                username=username,
                email=email,
                password=password,
                full_name=full_name,
                role=role
            )
            
            if not result['success']:
                return JsonResponse({
                    'success': False,
                    'error': result['error']
                }, status=400)
            
            return JsonResponse(result, status=201)
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class ListUsersView(View):
    
    @require_admin
    def get(self, request):
        try:
            include_inactive = request.GET.get('include_inactive', 'true').lower() == 'true'
            users = auth_service.list_users(role='usuario', include_inactive=include_inactive)
            
            return JsonResponse({
                'success': True,
                'users': users,
                'count': len(users)
            })
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ListSupportView(View):
    
    @require_admin
    def get(self, request):
        try:
            include_inactive = request.GET.get('include_inactive', 'true').lower() == 'true'
            users = auth_service.list_users(role='soporte', include_inactive=include_inactive)
            
            return JsonResponse({
                'success': True,
                'users': users,
                'count': len(users)
            })
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class UpdateProfilePictureView(View):
    
    def post(self, request):
        try:
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return JsonResponse({
                    'error': 'Authentication required'
                }, status=401)
            
            token = auth_header.replace('Bearer ', '')
            current_user = auth_service.get_current_user(token)
            
            if not current_user:
                return JsonResponse({
                    'error': 'Invalid token'
                }, status=401)
            
            body = json.loads(request.body)
            picture_url = body.get('picture_url')
            
            if not picture_url:
                return JsonResponse({
                    'error': 'picture_url required'
                }, status=400)
            
            result = auth_service.update_profile_picture(
                current_user['id'],
                picture_url
            )
            
            if not result['success']:
                return JsonResponse({
                    'error': result['error']
                }, status=400)
            
            return JsonResponse(result)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ToggleUserStatusView(View):

    @require_admin
    def patch(self, request, user_id):
        try:
            result = auth_service.toggle_user_status(user_id)
            
            if not result['success']:
                return JsonResponse({
                    'success': False,
                    'error': result['error']
                }, status=400)
            
            return JsonResponse(result)
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EditUserView(View):
    
    @require_admin
    def patch(self, request, user_id):
        try:
            body = json.loads(request.body)
            
            result = auth_service.edit_user(
                user_id=user_id,
                username=body.get('username'),
                email=body.get('email'),
                full_name=body.get('full_name'),
                role=body.get('role')
            )
            
            if not result['success']:
                return JsonResponse({
                    'success': False,
                    'error': result['error']
                }, status=400)
            
            return JsonResponse(result)
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DeleteUserView(View):
    """Endpoint para eliminar usuarios (solo admin)"""
    
    @require_admin
    def delete(self, request, user_id):
        try:
            result = auth_service.delete_user(user_id)
            
            if not result['success']:
                return JsonResponse({
                    'success': False,
                    'error': result['error']
                }, status=400)
            
            return JsonResponse({
                'success': True,
                'message': 'Usuario eliminado correctamente'
            })
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)