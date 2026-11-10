# documents/apps.py
from django.apps import AppConfig
import sys
import os

class DocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'documents'
    
    def ready(self):
        
        if any(cmd in sys.argv for cmd in ['test', 'migrate', 'makemigrations', 'shell', 'createsuperuser']):
            return
        
        if os.environ.get('RUN_MAIN') != 'true':
            return
        
        try:
            from .background_processor import start_background_processing
            
            print("\n" + "="*80)
            print("INICIANDO BACKGROUND PROCESSOR")
            print("="*80 + "\n")
            
            start_background_processing()
            
        except Exception as e:
            print(f"Error iniciando BackgroundProcessor: {e}")
            import traceback
            traceback.print_exc()