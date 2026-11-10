# documents/services/storage_service.py
from typing import Optional, Tuple
from django.conf import settings
import io

class StorageService:
    """Servicio para gestionar archivos en Supabase Storage"""
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
        self.bucket_name = "documents"
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        try:
            self.supabase.storage.get_bucket(self.bucket_name)
            print(f"Bucket '{self.bucket_name}' existe")
        except Exception as e:
            try:
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={"public": False}
                )
                print(f"Bucket '{self.bucket_name}' creado")
            except Exception as create_error:
                print(f"Error creando bucket: {create_error}")
    
    def upload_file(
        self,
        file_content: bytes,
        user_id: str,
        batch_id: str,
        filename: str,
        file_hash: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Sube archivo a Supabase Storage"""
        try:
            safe_filename = f"{file_hash[:8]}_{filename}"
            file_path = f"{user_id}/{batch_id}/{safe_filename}"
            
            try:
                existing = self.supabase.storage.from_(self.bucket_name).list(f"{user_id}/{batch_id}")
                if any(f.get('name') == safe_filename for f in existing):
                    print(f"Archivo ya existe en storage: {file_path}")
                    return True, file_path, None
            except:
                pass
            
            result = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": self._get_content_type(filename),
                    "upsert": "false"
                }
            )
            
            print(f"Archivo subido: {file_path}")
            return True, file_path, None
            
        except Exception as e:
            error_msg = str(e)
            
            if "duplicate" in error_msg.lower() or "already exists" in error_msg.lower():
                print(f"Archivo duplicado en storage (no crítico): {file_path}")
                file_path = f"{user_id}/{batch_id}/{file_hash[:8]}_{filename}"
                return True, file_path, None
            
            print(f"Error subiendo archivo: {error_msg}")
            return False, None, error_msg
    
    def download_file(self, file_path: str) -> Tuple[bool, Optional[bytes], Optional[str]]:
        try:
            result = self.supabase.storage.from_(self.bucket_name).download(file_path)
            print(f"Archivo descargado: {file_path}")
            return True, result, None
        except Exception as e:
            error_msg = str(e)
            print(f"Error descargando archivo: {error_msg}")
            return False, None, error_msg
    
    def delete_file(self, file_path: str) -> Tuple[bool, Optional[str]]:
        try:
            self.supabase.storage.from_(self.bucket_name).remove([file_path])
            print(f"Archivo eliminado: {file_path}")
            return True, None
        except Exception as e:
            error_msg = str(e)
            print(f"Error eliminando archivo: {error_msg}")
            return False, error_msg
    
    def get_public_url(self, file_path: str) -> Optional[str]:
        try:
            result = self.supabase.storage.from_(self.bucket_name).create_signed_url(
                path=file_path,
                expires_in=3600
            )
            return result.get('signedURL')
        except Exception as e:
            print(f"✗ Error obteniendo URL: {e}")
            return None
    
    def _get_content_type(self, filename: str) -> str:
        if filename.lower().endswith('.pdf'):
            return 'application/pdf'
        elif filename.lower().endswith('.docx'):
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif filename.lower().endswith('.doc'):
            return 'application/msword'
        else:
            return 'application/octet-stream'
    
    def list_files(self, path_prefix: str = "") -> list:
        try:
            result = self.supabase.storage.from_(self.bucket_name).list(path_prefix)
            return result
        except Exception as e:
            print(f"Error listando archivos: {e}")
            return []