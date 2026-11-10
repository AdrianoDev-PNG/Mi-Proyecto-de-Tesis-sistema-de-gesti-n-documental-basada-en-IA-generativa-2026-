# Backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
import os

def serve_test_html(request):
    html_path = os.path.join(settings.BASE_DIR, 'static', 'test.html')
    
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    except FileNotFoundError:
        return HttpResponse(
            f"<h1>Error: No se encontró test.html</h1>"
            f"<p>Ruta buscada: {html_path}</p>"
            f"<p>Verifica que el archivo existe en esa ubicación.</p>",
            status=404
        )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/documents/', include('documents.urls')),
    path('api/users/', include('users.urls')),
    path('', serve_test_html, name='home'),
]