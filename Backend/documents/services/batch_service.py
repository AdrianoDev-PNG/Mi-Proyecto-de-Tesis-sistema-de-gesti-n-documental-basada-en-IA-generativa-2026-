# documents/services/batch_service.py
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.conf import settings

class BatchService:
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
    
    def get_or_create_batch(self, user_id: str) -> Dict[str, Any]:
        try:
            result = self.supabase.rpc(
                'get_or_create_batch',
                {'p_user_id': user_id}
            ).execute()
            batch_id = result.data
            batch = self.supabase.table('processing_batches').select('*').eq('id', batch_id).single().execute()
            return {'success': True, 'batch_id': batch_id, 'batch': batch.data}
        except Exception as e:
            print(f"Error en get_or_create_batch: {e}")
            return {'success': False, 'error': str(e)}
    
    def mark_old_batches_ready(self, minutes_old: int = 5) -> Dict[str, Any]:
        try:
            result = self.supabase.rpc(
                'mark_old_batches_ready',
                {'minutes_old': minutes_old}
            ).execute()
            affected_count = result.data
            return {
                'success': True,
                'affected_batches': affected_count,
                'message': f'{affected_count} lotes marcados como ready'
            }
        except Exception as e:
            print(f"Error en mark_old_batches_ready: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_next_batch_to_process(self) -> Optional[Dict[str, Any]]:
        try:
            result = self.supabase.rpc('get_next_batch_to_process').execute()
            batch_id = result.data
            if not batch_id:
                return None
            batch = self.supabase.table('processing_batches').select('*').eq('id', batch_id).single().execute()
            documents = self.supabase.table('documents').select('*').eq('batch_id', batch_id).execute()
            return {'batch': batch.data, 'documents': documents.data}
        except Exception as e:
            print(f"Error en get_next_batch_to_process: {e}")
            return None
    
    def mark_batch_failed(self, batch_id: str, error_message: str) -> Dict[str, Any]:
        """Marca batch como fallido"""
        try:
            self.supabase.rpc(
                'mark_batch_failed',
                {'p_batch_id': batch_id, 'p_error_message': error_message}
            ).execute()
            batch = self.supabase.table('processing_batches').select('*').eq('id', batch_id).single().execute()
            return {'success': True, 'batch': batch.data, 'will_retry': batch.data['status'] == 'retrying'}
        except Exception as e:
            print(f"Error en mark_batch_failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def mark_batch_completed(self, batch_id: str) -> Dict[str, Any]:
        try:
            self.supabase.rpc('mark_batch_completed', {'p_batch_id': batch_id}).execute()
            batch = self.supabase.table('processing_batches').select('*').eq('id', batch_id).single().execute()
            return {'success': True, 'batch': batch.data}
        except Exception as e:
            print(f"Error en mark_batch_completed: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_batch_statistics(self) -> Dict[str, Any]:
        try:
            result = self.supabase.rpc('get_batch_statistics').execute()
            stats = {}
            for row in result.data:
                stats[row['status']] = {
                    'count': row['count'],
                    'total_documents': row['total_documents'],
                    'avg_documents': float(row['avg_documents']) if row['avg_documents'] else 0
                }
            return {'success': True, 'statistics': stats}
        except Exception as e:
            print(f"Error en get_batch_statistics: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_batch_details(self, batch_id: str) -> Optional[Dict[str, Any]]:
        try:
            batch = self.supabase.table('batch_status_view').select('*').eq('batch_id', batch_id).single().execute()
            return batch.data
        except Exception as e:
            print(f"Error en get_batch_details: {e}")
            return None
    
    def list_batches(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        try:
            query = self.supabase.table('batch_status_view').select('*')
            if status:
                query = query.eq('status', status)
            result = query.order('created_at', desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            print(f"Error en list_batches: {e}")
            return []
    
    def get_batches_for_retry(self) -> List[Dict[str, Any]]:
        try:
            now = datetime.now().isoformat()
            result = self.supabase.table('processing_batches').select('*').eq(
                'status', 'retrying'
            ).lte('next_retry_at', now).execute()
            return result.data
        except Exception as e:
            print(f"Error en get_batches_for_retry: {e}")
            return []