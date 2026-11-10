# documents/services/search_history_service.py
from typing import Dict, List, Any, Optional
from datetime import datetime
from django.conf import settings

class SearchHistoryService:
    """Servicio para gestionar historial de búsquedas"""
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
        print("SearchHistoryService inicializado")
    
    def save_search(
        self,
        user_id: str,
        search_query: str,
        search_filters: Dict[str, Any],
        found_documents: List[Dict[str, Any]],
        result_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Guarda una búsqueda en el historial
        
        Args:
            user_id: ID del usuario que realizó la búsqueda
            search_query: Texto de búsqueda original
            search_filters: Filtros aplicados (JSONB)
            found_documents: Lista de documentos encontrados
            result_details: Detalles adicionales (tiempo de ejecución, etc.)
        """
        try:
            document_ids = [doc.get('document', {}).get('id') or doc.get('document_id') 
                          for doc in found_documents if doc.get('document') or doc.get('document_id')]
            
            if result_details is None:
                result_details = {}
            
            result_details['document_count'] = len(document_ids)
            result_details['search_timestamp'] = datetime.now().isoformat()
            
            result = self.supabase.table('search_history').insert({
                'user_id': user_id,
                'search_query': search_query,
                'search_filters': search_filters,
                'found_document_count': len(document_ids),
                'found_document_ids': document_ids,
                'result_details': result_details,
                'executed_at': datetime.now().isoformat()
            }).execute()
            
            search_id = result.data[0]['id']
            print(f"Búsqueda guardada: {search_id[:8]}... ({len(document_ids)} docs)")
            
            return {
                'success': True,
                'search_id': search_id,
                'message': 'Búsqueda guardada en historial'
            }
        
        except Exception as e:
            print(f"Error guardando búsqueda: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_user_search_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        try:
            count_result = self.supabase.table('search_history')\
                .select('id', count='exact')\
                .eq('user_id', user_id)\
                .execute()
            
            total_count = count_result.count if hasattr(count_result, 'count') else 0
            
            result = self.supabase.table('search_history')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('executed_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            searches = result.data
            
            total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
            current_page = (offset // limit) + 1
            has_next = (offset + limit) < total_count
            has_previous = offset > 0
            
            print(f"✓ Historial recuperado: {len(searches)} búsquedas (total: {total_count})")
            
            return {
                'success': True,
                'searches': searches,
                'count': len(searches),
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'current_page': current_page,
                    'total_pages': total_pages,
                    'has_next': has_next,
                    'has_previous': has_previous,
                    'next_offset': offset + limit if has_next else None,
                    'previous_offset': max(0, offset - limit) if has_previous else None
                }
            }
        
        except Exception as e:
            print(f"✗ Error obteniendo historial: {e}")
            return {
                'success': False,
                'error': str(e),
                'searches': [],
                'count': 0,
                'pagination': {}
            }
    
    def get_search_detail(self, search_id: str, user_id: str) -> Dict[str, Any]:
        """
        Obtiene los detalles completos de una búsqueda específica
        incluyendo los documentos encontrados
        
        Args:
            search_id: ID de la búsqueda
            user_id: ID del usuario (para validación)
        """
        try:
            search_result = self.supabase.table('search_history')\
                .select('*')\
                .eq('id', search_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            if not search_result.data:
                return {
                    'success': False,
                    'error': 'Búsqueda no encontrada o no autorizada'
                }
            
            search = search_result.data
            document_ids = search.get('found_document_ids', [])
            
            documents = []
            if document_ids and len(document_ids) > 0:
                docs_result = self.supabase.table('documents')\
                    .select('id, filename, document_type, upload_date, metadata, tags, summary')\
                    .in_('id', document_ids)\
                    .execute()
                
                documents = docs_result.data
            
            print(f"Detalle de búsqueda recuperado: {search_id[:8]}... ({len(documents)} docs)")
            
            return {
                'success': True,
                'search': search,
                'documents': documents,
                'document_count': len(documents)
            }
        
        except Exception as e:
            print(f"Error obteniendo detalle de búsqueda: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_search(self, search_id: str, user_id: str) -> Dict[str, Any]:
        try:
            result = self.supabase.table('search_history')\
                .delete()\
                .eq('id', search_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Búsqueda no encontrada o no autorizada'
                }
            
            print(f"Búsqueda eliminada: {search_id[:8]}...")
            
            return {
                'success': True,
                'message': 'Búsqueda eliminada del historial'
            }
        
        except Exception as e:
            print(f"Error eliminando búsqueda: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def clear_user_history(self, user_id: str) -> Dict[str, Any]:
        try:
            result = self.supabase.table('search_history')\
                .delete()\
                .eq('user_id', user_id)\
                .execute()
            
            deleted_count = len(result.data) if result.data else 0
            
            print(f"Historial limpiado: {deleted_count} búsquedas eliminadas")
            
            return {
                'success': True,
                'message': f'{deleted_count} búsquedas eliminadas',
                'deleted_count': deleted_count
            }
        
        except Exception as e:
            print(f"Error limpiando historial: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_popular_searches(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        try:
            result = self.supabase.table('search_history')\
                .select('search_query, found_document_count')\
                .eq('user_id', user_id)\
                .execute()
            
            query_stats = {}
            for search in result.data:
                query = search['search_query']
                if query not in query_stats:
                    query_stats[query] = {
                        'query': query,
                        'count': 0,
                        'total_docs_found': 0
                    }
                query_stats[query]['count'] += 1
                query_stats[query]['total_docs_found'] += search.get('found_document_count', 0)
            
            popular = sorted(
                query_stats.values(),
                key=lambda x: x['count'],
                reverse=True
            )[:limit]
            
            print(f"Búsquedas populares: {len(popular)} consultas")
            
            return {
                'success': True,
                'popular_searches': popular,
                'count': len(popular)
            }
        
        except Exception as e:
            print(f"Error obteniendo búsquedas populares: {e}")
            return {
                'success': False,
                'error': str(e),
                'popular_searches': [],
                'count': 0
            }