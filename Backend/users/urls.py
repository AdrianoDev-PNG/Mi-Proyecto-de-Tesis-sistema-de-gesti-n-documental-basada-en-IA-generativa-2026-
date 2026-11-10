# users/urls.py
from django.urls import path
from .views import (
    LoginView,
    RefreshTokenView,
    MeView,
    CreateUserView,
    ListUsersView,
    ListSupportView,
    UpdateProfilePictureView,
    ToggleUserStatusView,
    EditUserView,
    DeleteUserView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    path('me/', MeView.as_view(), name='me'),
    path('create/', CreateUserView.as_view(), name='create_user'),
    path('list/', ListUsersView.as_view(), name='list_users'),
    path('list-support/', ListSupportView.as_view(), name='list_support'),
    path('profile-picture/', UpdateProfilePictureView.as_view(), name='update_profile_picture'),
    path('<str:user_id>/toggle-status/', ToggleUserStatusView.as_view(), name='toggle_user_status'),
    path('<str:user_id>/edit/', EditUserView.as_view(), name='edit_user'),
    path('<str:user_id>/delete/', DeleteUserView.as_view(), name='delete_user'),
]