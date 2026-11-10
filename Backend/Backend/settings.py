from pathlib import Path
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    'documents',
    'users',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "Backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / 'templates'],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "Backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.dummy",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_CLIENT = create_client(SUPABASE_URL, SUPABASE_KEY)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Faltan variables de entorno necesarias: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY")

CORS_ALLOWED_ORIGINS_ENV = os.getenv("CORS_ALLOWED_ORIGINS", "")

if CORS_ALLOWED_ORIGINS_ENV:
    CORS_ALLOWED_ORIGINS = [
        origin.strip() 
        for origin in CORS_ALLOWED_ORIGINS_ENV.split(",") 
        if origin.strip()
    ]
else:
    CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
    print("⚠️  CORS_ALLOWED_ORIGINS no configurado, usando localhost:3000 por defecto")

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_EXPOSE_HEADERS = [
    "content-type",
    "authorization",
]

CORS_PREFLIGHT_MAX_AGE = 86400

POPPLER_PATH = os.getenv(
    "POPPLER_PATH", 
    str(BASE_DIR / "poppler" / "Library" / "bin")
)

if POPPLER_PATH and not os.path.exists(POPPLER_PATH):
    import platform
    if platform.system() == "Windows":
        print(f"⚠️ ADVERTENCIA: POPPLER_PATH configurado pero no existe: {POPPLER_PATH}")
        print("   Asegúrate de tener Poppler instalado o configurar POPPLER_PATH en .env")