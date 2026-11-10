# documents/background_processor.py
import threading
import time
import asyncio
from datetime import datetime, timedelta
from django.conf import settings
from .services import DocumentService, BatchService, StorageService

class BackgroundProcessor:
    
    def __init__(self, interval_seconds=10):
        self.interval = interval_seconds
        self.running = False
        self.thread = None
        self.document_service = DocumentService()
        self.batch_service = BatchService()
        self.storage_service = StorageService()
        self.supabase = settings.SUPABASE_CLIENT
        self.cycle_count = 0
        self.last_batch_processed_at = None
        self.quota_exceeded = False
        self.quota_exceeded_at = None
    
    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        print(f"BackgroundProcessor iniciado (cada {self.interval}s)")
    
    def stop(self):
        """Detiene el procesador"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("BackgroundProcessor detenido")
    
    def _run_loop(self):
        print("BackgroundProcessor: Loop iniciado")
        while self.running:
            try:
                self.cycle_count += 1
                
                if self.cycle_count % 6 == 0:
                    self._mark_old_batches_ready()
                
                if self.quota_exceeded:
                    self._check_quota_recovery()
                    time.sleep(self.interval)
                    continue
                
                can_process = self._can_process_next_batch()
                
                if can_process:
                    batch_processed = self._process_one_batch()
                    if batch_processed:
                        self.last_batch_processed_at = datetime.now()
                        print(f"Esperando 1 minuto antes del próximo lote...\n")
                else:
                    if self.last_batch_processed_at and self.cycle_count % 6 == 0:
                        elapsed = (datetime.now() - self.last_batch_processed_at).total_seconds()
                        remaining = max(0, 60 - elapsed)
                        print(f"sperando... {int(remaining)}s hasta próximo lote")
                
                time.sleep(self.interval)
                
            except Exception as e:
                print(f"[WORKER] Error en loop: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(5)
    
    def _can_process_next_batch(self):
        if self.last_batch_processed_at is None:
            return True
        elapsed = (datetime.now() - self.last_batch_processed_at).total_seconds()
        return elapsed >= 60
    
    def _check_quota_recovery(self):
        if not self.quota_exceeded_at:
            return
        
        elapsed = (datetime.now() - self.quota_exceeded_at).total_seconds()
        wait_time = 60
        
        if elapsed >= wait_time:
            print(f"\nRecuperado de cuota excedida. Reanudando procesamiento...")
            self.quota_exceeded = False
            self.quota_exceeded_at = None
        else:
            remaining = int(wait_time - elapsed)
            if self.cycle_count % 6 == 0:
                print(f"CUOTA API EXCEDIDA - Esperando {remaining}s antes de reintentar")
    
    def _mark_old_batches_ready(self):
        try:
            result = self.batch_service.mark_old_batches_ready(minutes_old=5)
            if result['success'] and result['affected_batches'] > 0:
                print(f"\n[{time.strftime('%H:%M:%S')}] {result['affected_batches']} batches marcados como ready")
        except Exception as e:
            print(f"Error marcando batches antiguos: {e}")
    
    def _process_one_batch(self):
        try:
            next_batch = self._get_next_batch_to_process()
            if not next_batch:
                return False
            
            batch_id = next_batch['id']
            batch_status = next_batch['status']
            retry_count = next_batch.get('retry_count', 0)
            
            print(f"\n{'='*80}")
            if batch_status == 'retrying':
                print(f"[{time.strftime('%H:%M:%S')}] REINTENTANDO batch {batch_id[:8]}... (intento {retry_count + 1}/3)")
            else:
                print(f"[{time.strftime('%H:%M:%S')}] PROCESANDO batch {batch_id[:8]}...")
            print(f"{'='*80}\n")
            
            self.supabase.table('processing_batches').update({
                'status': 'processing',
                'started_at': datetime.now().isoformat()
            }).eq('id', batch_id).execute()
            
            docs = self.supabase.table('documents').select('*').eq(
                'batch_id', batch_id
            ).eq('state', 'pending').execute()
            
            if not docs.data:
                print(f"No hay documentos pendientes")
                self.batch_service.mark_batch_completed(batch_id)
                return True
            
            print(f"Procesando {len(docs.data)} documentos...\n")
            
            processed = 0
            failed = 0
            quota_hit = False
            
            for idx, doc in enumerate(docs.data, 1):
                try:
                    document_id = doc['id']
                    filename = doc['filename']
                    
                    print(f"   [{idx}/{len(docs.data)}] 🔄 {filename}...", end=' ')
                    
                    success, content, error = self.storage_service.download_file(doc['file_path'])
                    if not success:
                        print(f"Error descarga: {error}")
                        self.document_service.update_document_state(document_id, 'failed', error)
                        failed += 1
                        continue
                    
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    try:
                        result = loop.run_until_complete(
                            self.document_service.process_document_complete(
                                document_id,
                                content,
                                doc['file_type']
                            )
                        )
                        
                        if result:
                            processed += 1
                            print(f"✅")
                        else:
                            failed += 1
                            print(f"❌")
                    
                    except Exception as process_error:
                        if "QUOTA_EXCEEDED" in str(process_error):
                            print(f"🚨 CUOTA API EXCEDIDA")
                            quota_hit = True
                            self.quota_exceeded = True
                            self.quota_exceeded_at = datetime.now()
                            break
                        raise
                    
                    finally:
                        loop.close()
                
                except Exception as e:
                    if "QUOTA_EXCEEDED" not in str(e):
                        print(f" Excepción: {e}")
                        self.document_service.update_document_state(doc['id'], 'failed', str(e))
                        failed += 1
            
            print(f"\n Resultado: {processed} OK, {failed} fallos")
            
            if quota_hit:
                print(f"🚨 BATCH PAUSADO - Cuota API excedida")
                print(f"Todos los documentos pendientes se reintentarán en 1 minuto")
                return True
            
            if failed == 0:
                self.batch_service.mark_batch_completed(batch_id)
                print(f"Batch completado exitosamente")
            else:
                error_msg = f"{failed} de {len(docs.data)} documentos fallaron"
                result = self.batch_service.mark_batch_failed(batch_id, error_msg)
                if result.get('will_retry'):
                    print(f"   ⚠️{failed} documentos marcados para reintento")
                else:
                    print(f"   ❌ {failed} documentos fallaron definitivamente")
            
            print(f"\n{'='*80}\n")
            return True
        
        except Exception as e:
            print(f"Error procesando batch: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _get_next_batch_to_process(self):
        try:
            now = datetime.now().isoformat()
            result = self.supabase.table('processing_batches').select('*').or_(
                f'and(status.eq.retrying,next_retry_at.lte.{now},retry_count.lt.3),'
                f'status.eq.ready'
            ).order('status', desc=True).order('created_at', desc=False).limit(1).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"Error obteniendo siguiente batch: {e}")
            return None

_background_processor = None

def get_background_processor():
    global _background_processor
    if _background_processor is None:
        _background_processor = BackgroundProcessor(interval_seconds=10)
    return _background_processor

def start_background_processing():
    processor = get_background_processor()
    processor.start()

def stop_background_processing():
    processor = get_background_processor()
    processor.stop()