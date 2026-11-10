# No te olvides de reorganizar el codigo
# documents/views.py
import asyncio
import time
import zipfile
import rarfile
import io
import json
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from .services import BatchService, DocumentService, SearchService
from .services.storage_service import StorageService
from .services.search_history_service import SearchHistoryService
from .services.support_service import SupportService

batch_service = BatchService()
document_service = DocumentService()
search_service = SearchService()
storage_service = StorageService()
supabase = settings.SUPABASE_CLIENT
search_history_service = SearchHistoryService()
support_service = SupportService()

@method_decorator(csrf_exempt, name='dispatch')
class DeleteDocumentsView(View):
    
    def delete(self, request):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            
            document_ids = body.get('document_ids', [])
            user_id = body.get('user_id')
            delete_storage = body.get('delete_storage', True)
            
            if not document_ids or not isinstance(document_ids, list):
                return JsonResponse({
                    'success': False,
                    'error': 'Se requiere una lista de document_ids'
                }, status=400)
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            if len(document_ids) == 0:
                return JsonResponse({
                    'success': False,
                    'error': 'La lista de document_ids está vacía'
                }, status=400)
            
            if len(document_ids) > 100:
                return JsonResponse({
                    'success': False,
                    'error': 'Máximo 100 documentos por operación'
                }, status=400)
            
            documents_to_delete = []
            not_found = []
            unauthorized = []
            
            for doc_id in document_ids:
                doc = document_service.get_document_full(doc_id)
                
                if not doc:
                    not_found.append(doc_id)
                    print(f"Documento no encontrado: {doc_id}")
                    continue
                
                if doc.get('user_id') != user_id:
                    unauthorized.append(doc_id)
                    print(f"Documento no autorizado: {doc_id} (pertenece a otro usuario)")
                    continue
                
                documents_to_delete.append(doc)
                print(f"Documento válido para eliminar: {doc.get('filename')}")
            
            if not documents_to_delete:
                error_msg = []
                if not_found:
                    error_msg.append(f"{len(not_found)} documentos no encontrados")
                if unauthorized:
                    error_msg.append(f"{len(unauthorized)} documentos no autorizados")
                
                return JsonResponse({
                    'success': False,
                    'error': 'No se encontraron documentos válidos para eliminar',
                    'details': {
                        'not_found': not_found,
                        'unauthorized': unauthorized
                    }
                }, status=404 if not_found else 403)
            
            print(f"\n✓ {len(documents_to_delete)} documentos válidos para eliminar")
            
            results = {
                'deleted': [],
                'failed': [],
                'storage_deleted': [],
                'storage_failed': []
            }
            
            for doc in documents_to_delete:
                doc_id = doc['id']
                filename = doc.get('filename', 'Sin nombre')
                file_path = doc.get('file_path')
                batch_id = doc.get('batch_id')
                
                print(f"\n[{len(results['deleted']) + len(results['failed']) + 1}/{len(documents_to_delete)}] Eliminando: {filename}")
                
                storage_deleted = False
                storage_error = None
                
                if delete_storage and file_path:
                    try:
                        success, error = storage_service.delete_file(file_path)
                        if success:
                            storage_deleted = True
                            results['storage_deleted'].append({
                                'document_id': doc_id,
                                'file_path': file_path
                            })
                            print(f"Archivo eliminado del storage")
                        else:
                            storage_error = error
                            results['storage_failed'].append({
                                'document_id': doc_id,
                                'file_path': file_path,
                                'error': error
                            })
                            print(f"Error eliminando archivo: {error}")
                    except Exception as e:
                        storage_error = str(e)
                        results['storage_failed'].append({
                            'document_id': doc_id,
                            'file_path': file_path,
                            'error': str(e)
                        })
                        print(f"Excepción eliminando archivo: {e}")
                
                try:
                    supabase.table('documents').delete().eq('id', doc_id).execute()
                    
                    results['deleted'].append({
                        'document_id': doc_id,
                        'filename': filename,
                        'storage_deleted': storage_deleted,
                        'storage_error': storage_error
                    })
                    
                    print(f"Registro eliminado de la BD")
                    
                    if batch_id:
                        try:
                            supabase.rpc('decrement_batch_count', {'p_batch_id': batch_id}).execute()
                            print(f"Contador de batch actualizado")
                        except Exception as batch_err:
                            print(f"Error actualizando batch: {batch_err}")
                    
                except Exception as e:
                    results['failed'].append({
                        'document_id': doc_id,
                        'filename': filename,
                        'error': str(e)
                    })
                    print(f"Error eliminando de BD: {e}")
            
            total_deleted = len(results['deleted'])
            total_failed = len(results['failed'])
            total_storage_deleted = len(results['storage_deleted'])
            total_storage_failed = len(results['storage_failed'])

            if total_failed > 0:
                print(f" Fallos en BD: {total_failed}")
            if total_storage_failed > 0:
                print(f"Fallos en storage: {total_storage_failed}")
            print(f"{'='*80}\n")
            
            if total_deleted == len(documents_to_delete):
                status_code = 200
            elif total_deleted > 0:
                status_code = 207
            else:
                status_code = 500
            
            return JsonResponse({
                'success': total_deleted > 0,
                'message': f'{total_deleted} de {len(documents_to_delete)} documentos eliminados exitosamente',
                'summary': {
                    'requested': len(document_ids),
                    'found': len(documents_to_delete),
                    'not_found': len(not_found),
                    'unauthorized': len(unauthorized),
                    'deleted': total_deleted,
                    'failed': total_failed,
                    'storage_deleted': total_storage_deleted,
                    'storage_failed': total_storage_failed
                },
                'results': results,
                'warnings': {
                    'not_found': not_found,
                    'unauthorized': unauthorized
                }
            }, status=status_code)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            print(f"\nERROR EN ELIMINACIÓN:")
            print(f"   {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': 'Error interno del servidor',
                'detail': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DeleteDocumentView(View):
    
    def delete(self, request, document_id):
        try:
            user_id = request.GET.get('user_id')
            delete_storage_param = request.GET.get('delete_storage', 'true').lower()
            delete_storage = delete_storage_param in ['true', '1', 'yes']
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            import json
            mock_request = type('Request', (), {
                'body': json.dumps({
                    'document_ids': [document_id],
                    'user_id': user_id,
                    'delete_storage': delete_storage
                }).encode('utf-8')
            })()
            
            delete_view = DeleteDocumentsView()
            response = delete_view.delete(mock_request)
            
            if response.status_code == 200:
                data = json.loads(response.content)
                if data['summary']['deleted'] == 1:
                    return JsonResponse({
                        'success': True,
                        'message': 'Documento eliminado exitosamente',
                        'document_id': document_id,
                        'storage_deleted': data['summary']['storage_deleted'] > 0
                    })
            
            return response
        
        except Exception as e:
            print(f"Error eliminando documento individual: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SearchHistoryView(View):
    
    def get(self, request):
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            limit = int(request.GET.get('limit', 50))
            page = request.GET.get('page')
            offset = request.GET.get('offset')
            
            if page:
                page_num = int(page)
                offset = (page_num - 1) * limit
            elif offset:
                offset = int(offset)
            else:
                offset = 0
            
            result = search_history_service.get_user_search_history(
                user_id=user_id,
                limit=limit,
                offset=offset
            )
            
            return JsonResponse(result)
        
        except ValueError as e:
            return JsonResponse({
                'success': False,
                'error': f'Parámetro inválido: {str(e)}'
            }, status=400)
        except Exception as e:
            print(f"Error en historial de búsquedas: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def delete(self, request):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            user_id = body.get('user_id')
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            result = search_history_service.clear_user_history(user_id)
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error limpiando historial: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SearchHistoryDetailView(View):
    
    def get(self, request, search_id):
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            result = search_history_service.get_search_detail(search_id, user_id)
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error obteniendo detalle de búsqueda: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def delete(self, request, search_id):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            user_id = body.get('user_id') or request.GET.get('user_id')
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            result = search_history_service.delete_search(search_id, user_id)
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error eliminando búsqueda: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class PopularSearchesView(View):
    
    def get(self, request):
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            limit = int(request.GET.get('limit', 10))
            result = search_history_service.get_popular_searches(user_id, limit)
            
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error obteniendo búsquedas populares: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SupportTicketsView(View):
    
    def get(self, request):
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            status = request.GET.get('status')
            limit = int(request.GET.get('limit', 20))
            page = request.GET.get('page')
            offset = request.GET.get('offset')
            
            if page:
                page_num = int(page)
                offset = (page_num - 1) * limit
            elif offset:
                offset = int(offset)
            else:
                offset = 0
            
            result = support_service.get_user_tickets(
                user_id=user_id,
                status=status,
                limit=limit,
                offset=offset
            )
            
            return JsonResponse(result)
        
        except ValueError as e:
            return JsonResponse({
                'success': False,
                'error': f'Parámetro inválido: {str(e)}'
            }, status=400)
        except Exception as e:
            print(f"Error obteniendo tickets: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def post(self, request):
        try:
            user_id = request.POST.get('user_id')
            subject = request.POST.get('subject')
            description = request.POST.get('description')
            priority = request.POST.get('priority', 'medium')
            
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            if not subject or not description:
                return JsonResponse({
                    'success': False,
                    'error': 'subject y description son requeridos'
                }, status=400)
            
            attachment_file = None
            attachment_filename = None
            
            if 'attachment' in request.FILES:
                file = request.FILES['attachment']
                attachment_file = file.read()
                attachment_filename = file.name
                
                allowed_extensions = ['.png', '.jpg', '.jpeg', '.pdf']
                if not any(attachment_filename.lower().endswith(ext) for ext in allowed_extensions):
                    return JsonResponse({
                        'success': False,
                        'error': 'Solo se permiten archivos PNG, JPG, JPEG o PDF'
                    }, status=400)
                
                if len(attachment_file) > 5 * 1024 * 1024:
                    return JsonResponse({
                        'success': False,
                        'error': 'El archivo no puede superar los 5MB'
                    }, status=400)
            
            result = support_service.create_ticket(
                user_id=user_id,
                subject=subject,
                description=description,
                priority=priority,
                attachment_file=attachment_file,
                attachment_filename=attachment_filename
            )
            
            if result['success']:
                return JsonResponse(result, status=201)
            else:
                return JsonResponse(result, status=500)
        
        except Exception as e:
            print(f"❌ Error creando ticket: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SupportTicketDetailView(View):
    
    def get(self, request, ticket_id):
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            result = support_service.get_ticket_detail(ticket_id, user_id)
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error obteniendo detalle de ticket: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def patch(self, request, ticket_id):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            user_id = body.get('user_id')
            new_status = body.get('status')
            
            if not user_id or not new_status:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id y status son requeridos'
                }, status=400)
            
            result = support_service.update_ticket_status(
                ticket_id=ticket_id,
                user_id=user_id,
                new_status=new_status
            )
            
            return JsonResponse(result)
        
        except Exception as e:
            print(f"Error actualizando ticket: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class ExportSearchResultsView(View):
    
    def post(self, request):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            
            table_data = body.get('table_data', [])
            columns = body.get('columns', [])
            query = body.get('query', 'Búsqueda')
            
            if not table_data or not columns:
                return JsonResponse({
                    'error': 'Se requieren table_data y columns'
                }, status=400)
            
            for col in columns:
                if not isinstance(col, dict) or 'key' not in col or 'label' not in col:
                    return JsonResponse({
                        'error': 'Formato de columnas inválido'
                    }, status=400)
            wb = Workbook()
            ws = wb.active
            ws.title = "Resultados de Búsqueda"
            
            header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
            header_font = Font(bold=True, color="FFFFFF", size=11)
            header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            
            border = Border(
                left=Side(style='thin', color='CBD5E1'),
                right=Side(style='thin', color='CBD5E1'),
                top=Side(style='thin', color='CBD5E1'),
                bottom=Side(style='thin', color='CBD5E1')
            )
            
            title_cell = ws.cell(row=1, column=1, value=f"Resultados de Búsqueda: {query}")
            title_cell.font = Font(bold=True, size=14, color="1E293B")
            ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(columns))
            ws.row_dimensions[1].height = 25
            
            date_cell = ws.cell(row=2, column=1, value=f"Fecha de exportación: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
            date_cell.font = Font(size=10, italic=True, color="64748B")
            ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(columns))
            ws.row_dimensions[2].height = 18
            
            ws.row_dimensions[3].height = 5
            
            for col_idx, column in enumerate(columns, start=1):
                cell = ws.cell(row=4, column=col_idx, value=column['label'])
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = header_alignment
                cell.border = border
            
            ws.row_dimensions[4].height = 30
            
            for row_idx, row_data in enumerate(table_data, start=5):
                for col_idx, column in enumerate(columns, start=1):
                    col_key = column['key']
                    value = row_data.get(col_key, '')
                    
                    if value is None:
                        value = ''
                    
                    cell = ws.cell(row=row_idx, column=col_idx, value=value)
                    cell.border = border
                    
                    if col_key == 'total_amount' or (isinstance(value, (int, float)) and col_key.startswith('custom_')):
                        try:
                            cell.value = float(value) if value != '' else 0
                            cell.number_format = '#,##0.00'
                            cell.alignment = Alignment(horizontal="right", vertical="center")
                        except:
                            cell.alignment = Alignment(horizontal="left", vertical="center")
                    elif col_key in ['score', 'match_count']:
                        cell.alignment = Alignment(horizontal="center", vertical="center")
                    else:
                        cell.alignment = Alignment(horizontal="left", vertical="center")
                    
                    if row_idx % 2 == 0:
                        cell.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
                
                ws.row_dimensions[row_idx].height = 20
            
            for col_idx, column in enumerate(columns, start=1):
                col_key = column['key']
                col_letter = get_column_letter(col_idx)
                
                known_widths = {
                    'filename': 45,
                    'invoice_number': 18,
                    'issuer': 30,
                    'receiver': 30,
                    'date': 14,
                    'due_date': 14,
                    'currency': 10,
                    'total_amount': 16,
                    'document_type': 18,
                    'score': 12,
                    'match_count': 16,
                }
                
                if col_key in known_widths:
                    width = known_widths[col_key]
                else:
                    label_length = len(column['label'])
                    width = max(label_length + 5, 15)
                
                ws.column_dimensions[col_letter].width = width
            
            ws.auto_filter.ref = f"A4:{get_column_letter(len(columns))}{len(table_data) + 4}"
            
            ws.freeze_panes = "A5"
            
            numeric_columns = [col for col in columns if col['key'] in ['total_amount', 'score', 'match_count']]
            if numeric_columns and len(table_data) > 0:
                total_row = len(table_data) + 5
                ws.row_dimensions[total_row].height = 25
                
                total_label_cell = ws.cell(row=total_row, column=1, value="TOTAL")
                total_label_cell.font = Font(bold=True, size=11, color="1E293B")
                total_label_cell.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
                total_label_cell.alignment = Alignment(horizontal="right", vertical="center")
                total_label_cell.border = border
                
                for col_idx, column in enumerate(columns, start=1):
                    if column['key'] in ['total_amount']:
                        cell = ws.cell(row=total_row, column=col_idx)
                        total = sum(float(row.get(column['key'], 0) or 0) for row in table_data)
                        cell.value = total
                        cell.number_format = '#,##0.00'
                        cell.font = Font(bold=True, size=11)
                        cell.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
                        cell.alignment = Alignment(horizontal="right", vertical="center")
                        cell.border = border
                    elif column['key'] in ['match_count']:
                        cell = ws.cell(row=total_row, column=col_idx)
                        total = sum(int(row.get(column['key'], 0) or 0) for row in table_data)
                        cell.value = total
                        cell.font = Font(bold=True, size=11)
                        cell.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
                        cell.alignment = Alignment(horizontal="center", vertical="center")
                        cell.border = border
                    else:
                        cell = ws.cell(row=total_row, column=col_idx, value="")
                        cell.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
                        cell.border = border
            
            buffer = io.BytesIO()
            wb.save(buffer)
            buffer.seek(0)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"busqueda_resultados_{timestamp}.xlsx"
            
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            print(f"\nERROR EN EXPORTACIÓN EXCEL:")
            print(f"   {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'error': 'Error interno del servidor',
                'detail': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class BulkDownloadDocumentsView(View):
    
    def post(self, request):
        try:
            body = json.loads(request.body) if request.body else {}
            
            document_ids = body.get('document_ids', [])
            compression_format = body.get('format', 'zip').lower()
            archive_name = body.get('archive_name', 'documentos')
            
            if not document_ids or not isinstance(document_ids, list):
                return JsonResponse({
                    'error': 'Se requiere una lista de document_ids'
                }, status=400)
            
            if len(document_ids) == 0:
                return JsonResponse({
                    'error': 'La lista de documentos está vacía'
                }, status=400)
            
            if len(document_ids) > 100:
                return JsonResponse({
                    'error': 'Máximo 100 documentos por descarga'
                }, status=400)
            
            if compression_format not in ['zip', 'rar']:
                return JsonResponse({
                    'error': "Formato debe ser 'zip' o 'rar'"
                }, status=400)
            
            archive_name = self._sanitize_filename(archive_name)
            documents = []
            not_found = []
            
            for doc_id in document_ids:
                doc = document_service.get_document_full(doc_id)
                if doc and doc.get('file_path'):
                    documents.append(doc)
                    print(f"Documento encontrado: {doc.get('filename', 'Sin nombre')}")
                else:
                    not_found.append(doc_id)
                    print(f"Documento no encontrado o sin file_path: {doc_id}")
            
            if not documents:
                return JsonResponse({
                    'error': 'No se encontraron documentos válidos para descargar',
                    'not_found': not_found
                }, status=404)
            
            print(f"\n{len(documents)} documentos válidos encontrados")
            if not_found:
                print(f"{len(not_found)} documentos no encontrados")
            
            if compression_format == 'zip':
                archive_buffer = self._create_zip_archive(documents, archive_name)
                content_type = 'application/zip'
                file_extension = 'zip'
            else:
                archive_buffer = self._create_rar_archive(documents, archive_name)
                content_type = 'application/x-rar-compressed'
                file_extension = 'rar'
            
            if not archive_buffer:
                return JsonResponse({
                    'error': 'Error creando archivo comprimido'
                }, status=500)
            
            archive_size = len(archive_buffer.getvalue())
            response = HttpResponse(archive_buffer.getvalue(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{archive_name}.{file_extension}"'
            response['Content-Length'] = archive_size
            response['X-Documents-Count'] = len(documents)
            
            return response
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            print(f"\nERROR EN DESCARGA MASIVA:")
            print(f"   {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'error': 'Error interno del servidor',
                'detail': str(e)
            }, status=500)
    
    def _sanitize_filename(self, filename):
        import re
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        return filename[:100] if filename else 'documentos'
    
    def _create_zip_archive(self, documents, archive_name):
        try:
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                added_files = set()
                
                for idx, doc in enumerate(documents, 1):
                    filename = doc.get('filename', f'documento_{idx}')
                    print(f"[{idx}/{len(documents)}] Procesando: {filename}")
                    
                    success, content, error = storage_service.download_file(doc['file_path'])
                    
                    if not success:
                        print(f"Error descargando: {error}")
                        continue
                    
                    unique_filename = self._get_unique_filename(filename, added_files)
                    added_files.add(unique_filename)
                    
                    zip_file.writestr(unique_filename, content)
                    print(f"Agregado como: {unique_filename} ({len(content)} bytes)")
            
            zip_buffer.seek(0)
            return zip_buffer
        
        except Exception as e:
            print(f"Error creando ZIP: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _get_unique_filename(self, filename, existing_files):
        if filename not in existing_files:
            return filename
        
        parts = filename.rsplit('.', 1)
        if len(parts) == 2:
            name, ext = parts
        else:
            name, ext = filename, ''
        
        counter = 1
        while True:
            new_filename = f"{name}_{counter}.{ext}" if ext else f"{name}_{counter}"
            if new_filename not in existing_files:
                return new_filename
            counter += 1
    
    def _create_rar_archive(self, documents, archive_name):
        try:
            import subprocess
            rar_executable = self._find_rar_executable()
            
            if rar_executable:
                print("Ejecutable RAR encontrado, creando archivo RAR...")
                return self._create_rar_with_winrar(documents, archive_name, rar_executable)
            else:
                print("WinRAR no encontrado, usando ZIP como alternativa")
                return self._create_zip_archive(documents, archive_name)
        
        except Exception as e:
            print(f"No se puede crear RAR nativo: {e}")
            print("   Usando ZIP como alternativa")
            return self._create_zip_archive(documents, archive_name)
    
    def _find_rar_executable(self):
        import shutil
        import platform
        import os
        
        if platform.system() == 'Windows':
            possible_paths = [
                r'C:\Program Files\WinRAR\Rar.exe',
                r'C:\Program Files (x86)\WinRAR\Rar.exe',
            ]
        else:
            possible_paths = [
                '/usr/bin/rar',
                '/usr/local/bin/rar',
            ]
        
        rar_path = shutil.which('rar')
        if rar_path:
            return rar_path
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def _create_rar_with_winrar(self, documents, archive_name, rar_executable):
        import tempfile
        import subprocess
        import os
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                rar_path = os.path.join(temp_dir, f"{archive_name}.rar")
                files_dir = os.path.join(temp_dir, "files")
                os.makedirs(files_dir)
                
                added_files = set()
                
                for idx, doc in enumerate(documents, 1):
                    filename = doc.get('filename', f'documento_{idx}')
                    print(f"[{idx}/{len(documents)}] Preparando: {filename}")
                    
                    success, content, error = storage_service.download_file(doc['file_path'])
                    if not success:
                        print(f"Error descargando: {error}")
                        continue
                    
                    unique_filename = self._get_unique_filename(filename, added_files)
                    added_files.add(unique_filename)
                    
                    file_path = os.path.join(files_dir, unique_filename)
                    with open(file_path, 'wb') as f:
                        f.write(content)
                    
                    print(f"Guardado: {unique_filename}")

                subprocess.run([
                    rar_executable,
                    'a',
                    '-r',
                    '-ep1',
                    rar_path,
                    os.path.join(files_dir, '*')
                ], check=True, capture_output=True)
                
                with open(rar_path, 'rb') as f:
                    rar_buffer = io.BytesIO(f.read())
                return rar_buffer
        
        except subprocess.CalledProcessError as e:
            print(f"Error ejecutando WinRAR: {e}")
            print(f"Salida: {e.output if hasattr(e, 'output') else 'N/A'}")
            return None
        except Exception as e:
            print(f"Error con WinRAR: {e}")
            import traceback
            traceback.print_exc()
            return None

@method_decorator(csrf_exempt, name='dispatch')
class UploadDocumentsView(View):
    
    def post(self, request):
        try:
            start_time = time.time()
            files = request.FILES.getlist('files')
            user_id = request.POST.get('user_id')
            
            if not files:
                return JsonResponse({'error': 'No files provided'}, status=400)
            if not user_id:
                return JsonResponse({'error': 'user_id required'}, status=400)
            
            results = []
            uploaded_count = 0
            uploaded_ids = []
            duplicate_count = 0
            current_batch_id = None
            docs_in_current_batch = 0
            
            file_hashes = {}
            for file in files:
                content = file.read()
                file.seek(0)
                file_hash = document_service.calculate_file_hash(content)
                file_hashes[file.name] = {
                    'hash': file_hash,
                    'content': content,
                    'size': len(content)
                }

            existing_hashes = {}
            for filename, data in file_hashes.items():
                existing = document_service.check_duplicate(data['hash'])
                if existing:
                    existing_hashes[filename] = existing
                    duplicate_count += 1
                    print(f"✓ DUPLICADO DETECTADO: {filename} (ID: {existing['id'][:8]}...)")
            
            for idx, file in enumerate(files, 1):
                try:
                    # Omitir duplicados
                    if file.name in existing_hashes:
                        results.append({
                            'filename': file.name,
                            'status': 'duplicate',
                            'document_id': existing_hashes[file.name]['id'],
                            'message': 'Archivo ya existe en el sistema'
                        })
                        print(f"[{idx}/{len(files)}] ⊘ Omitido (duplicado): {file.name}")
                        continue

                    if current_batch_id is None or docs_in_current_batch >= 10:
                        batch_result = batch_service.get_or_create_batch(user_id)
                        if not batch_result['success']:
                            results.append({
                                'filename': file.name,
                                'status': 'error',
                                'error': f"Error creando batch: {batch_result['error']}"
                            })
                            continue
                        current_batch_id = batch_result['batch_id']
                        docs_in_current_batch = batch_result['batch'].get('document_count', 0)
                        print(f"\n📦 Batch ID: {current_batch_id[:8]}... ({docs_in_current_batch}/10)\n")
                    
                    print(f"[{idx}/{len(files)}] 🔄 Procesando: {file.name}")
                    
                    if not file.name.lower().endswith(('.pdf', '.docx')):
                        results.append({
                            'filename': file.name,
                            'status': 'rejected',
                            'error': 'Only PDF and DOCX allowed'
                        })
                        print(f"[{idx}/{len(files)}] ✗ Rechazado: extensión no permitida")
                        continue
                    
                    file_data = file_hashes[file.name]
                    content = file_data['content']
                    file_hash = file_data['hash']
                    file_type = 'pdf' if file.name.lower().endswith('.pdf') else 'docx'
                    
                    print(f"[{idx}/{len(files)}]    📝 Hash: {file_hash[:16]}...")
                    
                    upload_start = time.time()
                    upload_success, file_path, upload_error = storage_service.upload_file(
                        file_content=content,
                        user_id=user_id,
                        batch_id=current_batch_id,
                        filename=file.name,
                        file_hash=file_hash
                    )
                    upload_time = time.time() - upload_start
                    
                    if not upload_success:
                        results.append({
                            'filename': file.name,
                            'status': 'storage_error',
                            'error': upload_error
                        })
                        print(f"[{idx}/{len(files)}] ✗ Error storage: {upload_error}")
                        continue
                    
                    print(f"[{idx}/{len(files)}]    ☁️ Storage OK ({upload_time:.2f}s)")
                    
                    db_start = time.time()
                    doc_result = document_service.create_document_record(
                        user_id=user_id,
                        batch_id=current_batch_id,
                        filename=file.name,
                        file_type=file_type,
                        file_size=file_data['size'],
                        file_hash=file_hash,
                        file_path=file_path
                    )
                    db_time = time.time() - db_start
                    
                    if not doc_result['success']:
                        storage_service.delete_file(file_path)
                        results.append({
                            'filename': file.name,
                            'status': 'error',
                            'error': doc_result['error']
                        })
                        print(f"[{idx}/{len(files)}] ✗ Error BD: {doc_result['error']}")
                        continue
                    
                    document_id = doc_result['document']['id']
                    uploaded_count += 1
                    uploaded_ids.append(document_id)
                    docs_in_current_batch += 1
                    
                    results.append({
                        'filename': file.name,
                        'status': 'uploaded',
                        'document_id': document_id,
                        'batch_id': current_batch_id
                    })
                    
                    print(f"[{idx}/{len(files)}] ✓ Guardado exitosamente (BD: {db_time:.2f}s)")
                    
                except Exception as e:
                    print(f"[{idx}/{len(files)}] ✗ Excepción: {str(e)}")
                    results.append({
                        'filename': file.name,
                        'status': 'error',
                        'error': str(e)
                    })
            
            total_time = time.time() - start_time

            return JsonResponse({
                'success': True,
                'message': f'{uploaded_count} archivos nuevos guardados, {duplicate_count} duplicados omitidos',
                'total_uploaded': uploaded_count,
                'total_received': len(files),
                'duplicates_skipped': duplicate_count,
                'processing_time': round(total_time, 2),
                'uploaded_ids': uploaded_ids,
                'results': results,
                'summary': {
                    'uploaded': uploaded_count,
                    'duplicate': duplicate_count,
                    'failed': sum(1 for r in results if r['status'] in ['error', 'storage_error']),
                    'rejected': sum(1 for r in results if r['status'] == 'rejected')
                }
            })
        
        except Exception as e:
            print(f"\n❌ ERROR GENERAL EN CARGA:")
            print(f"   {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
@method_decorator(csrf_exempt, name='dispatch')
class ProcessPendingDocumentsView(View):
    
    async def post(self, request):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            limit = body.get('limit', 50)
            
            print(f"\n{'='*80}")
            print(f"🔄 PROCESAMIENTO MANUAL DE DOCUMENTOS PENDIENTES")
            print(f"{'='*80}\n")
            
            pending_docs = document_service.get_pending_documents(limit=limit)
            
            if not pending_docs:
                return JsonResponse({
                    'message': 'No hay documentos pendientes',
                    'processed': 0
                })
            
            print(f"{len(pending_docs)} documentos pendientes\n")
            
            batch_size = 10
            total_processed = 0
            total_failed = 0
            quota_hit = False
            
            for i in range(0, len(pending_docs), batch_size):
                if quota_hit:
                    print(f"\n🚨 Cuota API excedida - Deteniendo procesamiento")
                    break
                
                batch_docs = pending_docs[i:i + batch_size]
                print(f"Lote {(i//batch_size)+1}...")
                
                user_id = batch_docs[0]['user_id']
                batch_result = batch_service.get_or_create_batch(user_id)
                
                if not batch_result['success']:
                    continue
                
                batch_id = batch_result['batch_id']
                
                for doc in batch_docs:
                    try:
                        document_id = doc['id']
                        print(f"{doc['filename']}")
                        
                        document_service.assign_to_batch(document_id, batch_id)
                        success, content, error = storage_service.download_file(doc['file_path'])
                        
                        if not success:
                            print(f"Error descarga")
                            document_service.update_document_state(document_id, 'failed', error)
                            total_failed += 1
                            continue
                        
                        process_success = await document_service.process_document_complete(
                            document_id, content, doc['file_type']
                        )
                        
                        if process_success:
                            total_processed += 1
                            print(f"OK")
                        else:
                            total_failed += 1
                            print(f"Falló")
                    
                    except Exception as e:
                        if "QUOTA_EXCEEDED" in str(e):
                            quota_hit = True
                            print(f"CUOTA API EXCEDIDA")
                            break
                        print(f"Error: {e}")
                        document_service.update_document_state(doc['id'], 'failed', str(e))
                        total_failed += 1
                
                batch_service.mark_batch_completed(batch_id)
            return JsonResponse({
                'success': True,
                'processed': total_processed,
                'failed': total_failed,
                'quota_exceeded': quota_hit,
                'message': 'Cuota API excedida' if quota_hit else 'Procesamiento completado'
            })
        
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class ListDocumentsView(View):
    
    def get(self, request):
        try:
            user_id = request.GET.get('user_id')
            state = request.GET.get('state')
            batch_id = request.GET.get('batch_id')
            limit = int(request.GET.get('limit', 20))
            page = request.GET.get('page')
            offset = request.GET.get('offset')
            
            if page:
                page_num = int(page)
                offset = (page_num - 1) * limit
            elif offset:
                offset = int(offset)
            else:
                offset = 0
            
            if not user_id:
                return JsonResponse({'success': False, 'error': 'user_id requerido'}, status=400)
            
            result = document_service.list_documents(
                user_id=user_id,
                state=state,
                batch_id=batch_id,
                limit=limit,
                offset=offset
            )
            
            if not result.get('success'):
                return JsonResponse(result, status=403 if 'autorizado' in result.get('error', '') else 500)
            
            return JsonResponse(result)
        
        except ValueError as e:
            return JsonResponse({'success': False, 'error': f'Parámetro inválido: {str(e)}'}, status=400)
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class DocumentDetailView(View):
    
    def get(self, request, document_id):
        document = document_service.get_document_full(document_id)
        if not document:
            return JsonResponse({'error': 'Document not found'}, status=404)
        if document.get('file_path'):
            download_url = storage_service.get_public_url(document['file_path'])
            document['download_url'] = download_url
        return JsonResponse({'document': document})

@method_decorator(csrf_exempt, name='dispatch')
class DownloadDocumentView(View):
    
    def get(self, request, document_id):
        doc = document_service.get_document_full(document_id)
        if not doc or not doc.get('file_path'):
            return JsonResponse({'error': 'Document not found'}, status=404)
        success, content, error = storage_service.download_file(doc['file_path'])
        if not success:
            return JsonResponse({'error': error}, status=500)
        response = HttpResponse(content, content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{doc["filename"]}"'
        return response

@method_decorator(csrf_exempt, name='dispatch')
class IntelligentSearchView(View):
    
    async def post(self, request):
        import json
        import time
        try:
            body = json.loads(request.body)
            query = body.get('query', '')
            user_id = body.get('user_id')
            
            if not query:
                return JsonResponse({
                    'error': 'query required'
                }, status=400)
            
            if not user_id:
                return JsonResponse({
                    'error': 'user_id required para guardar búsqueda'
                }, status=400)
            
            start_time = time.time()
            
            search_criteria = await search_service.process_search_query(query)
            results = await search_service.search_documents(search_criteria)
            
            execution_time = time.time() - start_time
            
            result_details = {
                'execution_time_seconds': round(execution_time, 2),
                'search_type': search_criteria.get('search_type'),
                'intent': search_criteria.get('intent'),
                'filters_applied': search_criteria.get('filters', {})
            }
            
            try:
                search_history_service.save_search(
                    user_id=user_id,
                    search_query=query,
                    search_filters=search_criteria.get('filters', {}),
                    found_documents=results,
                    result_details=result_details
                )
            except Exception as e:
                print(f"Error guardando búsqueda en historial: {e}")
            
            return JsonResponse({
                'query': query,
                'search_criteria': search_criteria,
                'results': results,
                'count': len(results),
                'execution_time': round(execution_time, 2)
            })
        
        except Exception as e:
            print(f"Error en búsqueda inteligente: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class BatchListView(View):
    
    def get(self, request):
        status = request.GET.get('status')
        limit = int(request.GET.get('limit', 50))
        batches = batch_service.list_batches(status=status, limit=limit)
        return JsonResponse({'batches': batches, 'count': len(batches)})

@method_decorator(csrf_exempt, name='dispatch')
class BatchDetailView(View):
    
    def get(self, request, batch_id):
        batch = batch_service.get_batch_details(batch_id)
        if not batch:
            return JsonResponse({'error': 'Batch not found'}, status=404)
        return JsonResponse({'batch': batch})

@method_decorator(csrf_exempt, name='dispatch')
class BatchStatisticsView(View):
    
    def get(self, request):
        try:
            stats = batch_service.get_batch_statistics()
            return JsonResponse(stats)
        except Exception as e:
            print(f"Error obteniendo estadísticas: {e}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SearchItemsView(View):
    """Búsqueda de items específicos en documentos procesados (JSONB)"""
    
    def get(self, request):
        try:
            name = request.GET.get('name')
            min_price = request.GET.get('min_price')
            max_price = request.GET.get('max_price')
            item_type = request.GET.get('item_type')
            limit = int(request.GET.get('limit', 50))
            
            query = supabase.table('documents').select('id, filename, upload_date, items, metadata')
            
            result = query.limit(500).execute()
            
            matching_items = []
            
            for doc in result.data:
                items = doc.get('items', [])
                if not isinstance(items, list):
                    continue
                
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    
                    item_name = item.get('name', '')
                    item_price = item.get('total_price', 0) or item.get('unit_price', 0) or 0
                    item_item_type = item.get('type', '')
                    
                    if name and name.lower() not in item_name.lower():
                        continue
                    
                    try:
                        item_price_float = float(item_price)
                        if min_price and item_price_float < float(min_price):
                            continue
                        if max_price and item_price_float > float(max_price):
                            continue
                    except:
                        pass
                    
                    if item_type and item_item_type != item_type:
                        continue
                    
                    matching_items.append({
                        'document_id': doc['id'],
                        'filename': doc.get('filename'),
                        'upload_date': doc.get('upload_date'),
                        'item_name': item_name,
                        'item_type': item_item_type,
                        'quantity': item.get('quantity'),
                        'unit_price': item.get('unit_price'),
                        'total_price': item.get('total_price'),
                        'currency': item.get('currency', 'PEN'),
                        'description': item.get('description')
                    })
            
            matching_items = matching_items[:limit]
            
            return JsonResponse({
                'items': matching_items,
                'count': len(matching_items)
            })
        
        except Exception as e:
            print(f"Error buscando items: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class StatsView(View):
    
    def get(self, request):
        try:
            user_id = request.GET.get('user_id')
            days = int(request.GET.get('days', 30))
            total_docs = supabase.table('documents').select('id', count='exact').execute()
            pending = supabase.table('documents').select('id', count='exact').eq('state', 'pending').execute()
            completed = supabase.table('documents').select('id', count='exact').eq('state', 'completed').execute()
            processing = supabase.table('documents').select('id', count='exact').eq('state', 'processing').execute()
            failed = supabase.table('documents').select('id', count='exact').eq('state', 'failed').execute()

            start_date = (datetime.now() - timedelta(days=days)).date()
            
            docs_in_period = supabase.table('documents').select(
                'upload_date, state'
            ).gte('upload_date', start_date.isoformat()).execute()
            
            docs_by_day_dict = {}
            for doc in docs_in_period.data:
                upload_date = doc['upload_date'][:10]
                state = doc['state']
                
                if upload_date not in docs_by_day_dict:
                    docs_by_day_dict[upload_date] = {
                        'date': upload_date,
                        'count': 0,
                        'completed': 0,
                        'failed': 0
                    }
                
                docs_by_day_dict[upload_date]['count'] += 1
                if state == 'completed':
                    docs_by_day_dict[upload_date]['completed'] += 1
                elif state == 'failed':
                    docs_by_day_dict[upload_date]['failed'] += 1
            
            docs_by_day = sorted(docs_by_day_dict.values(), key=lambda x: x['date'])
            
            all_docs = supabase.table('documents').select('metadata').execute()
            
            type_counts = {}
            for doc in all_docs.data:
                doc_type = doc.get('metadata', {}).get('document_type', 'Sin clasificar')
                if not doc_type or doc_type == 'null':
                    doc_type = 'Sin clasificar'
                type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
            
            document_types = [
                {
                    'type': k, 
                    'count': v, 
                    'percentage': round(v / total_docs.count * 100, 1) if total_docs.count > 0 else 0
                }
                for k, v in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
            ]

            all_tags = supabase.table('documents').select('tags').execute()
            
            tag_frequency = {}
            for doc in all_tags.data:
                tags = doc.get('tags', [])
                if isinstance(tags, list):
                    for tag_obj in tags:
                        if isinstance(tag_obj, dict):
                            tag_name = tag_obj.get('tag', '')
                            category = tag_obj.get('category', 'general')
                            if tag_name:
                                key = f"{tag_name}|{category}"
                                if key not in tag_frequency:
                                    tag_frequency[key] = {
                                        'tag': tag_name,
                                        'category': category,
                                        'count': 0,
                                        'avg_confidence': 0,
                                        'confidences': []
                                    }
                                tag_frequency[key]['count'] += 1
                                confidence = tag_obj.get('confidence', 0)
                                tag_frequency[key]['confidences'].append(confidence)
            
            top_tags = []
            for data in tag_frequency.values():
                data['avg_confidence'] = round(
                    sum(data['confidences']) / len(data['confidences']) if data['confidences'] else 0, 
                    2
                )
                del data['confidences']
                top_tags.append(data)
            
            top_tags = sorted(top_tags, key=lambda x: x['count'], reverse=True)[:20]
            
            all_metadata = supabase.table('documents').select('metadata').execute()
            
            currency_totals = {}
            for doc in all_metadata.data:
                metadata = doc.get('metadata', {})
                amount = metadata.get('total_amount', 0)
                currency = metadata.get('currency', 'PEN')
                
                if amount:
                    try:
                        amount_float = float(amount)
                        if currency not in currency_totals:
                            currency_totals[currency] = {'total': 0, 'count': 0}
                        currency_totals[currency]['total'] += amount_float
                        currency_totals[currency]['count'] += 1
                    except:
                        pass
            
            financial_summary = [
                {
                    'currency': k,
                    'total_amount': round(v['total'], 2),
                    'document_count': v['count'],
                    'average': round(v['total'] / v['count'], 2) if v['count'] > 0 else 0
                }
                for k, v in currency_totals.items()
            ]
            
            recent_docs = supabase.table('documents').select(
                'id, filename, state, upload_date, processed_at, document_type'
            ).order('upload_date', desc=True).limit(10).execute()
            
            recent_activity = []
            for doc in recent_docs.data:
                activity = {
                    'id': doc['id'],
                    'filename': doc['filename'],
                    'type': doc.get('document_type', 'documento'),
                    'state': doc['state'],
                    'uploaded': doc['upload_date'],
                }
                
                if doc.get('processed_at'):
                    activity['processed'] = doc['processed_at']
                    try:
                        upload = datetime.fromisoformat(doc['upload_date'].replace('Z', '+00:00'))
                        process = datetime.fromisoformat(doc['processed_at'].replace('Z', '+00:00'))
                        activity['processing_time'] = str(process - upload)
                    except:
                        pass
                
                recent_activity.append(activity)
            
            total_size_result = supabase.table('documents').select('file_size').execute()
            total_size = sum(doc.get('file_size', 0) for doc in total_size_result.data)
            
            def format_size(bytes_size):
                for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                    if bytes_size < 1024.0:
                        return f"{bytes_size:.2f} {unit}"
                    bytes_size /= 1024.0
                return f"{bytes_size:.2f} PB"
            
            all_entities = supabase.table('documents').select('entities').execute()
            
            org_frequency = {}
            person_frequency = {}
            location_frequency = {}
            
            for doc in all_entities.data:
                entities = doc.get('entities', {})
                
                for org in entities.get('organizaciones', []):
                    if org:
                        org_frequency[org] = org_frequency.get(org, 0) + 1
                
                for person in entities.get('personas', []):
                    if person:
                        person_frequency[person] = person_frequency.get(person, 0) + 1
                
                for loc in entities.get('lugares', []):
                    if loc:
                        location_frequency[loc] = location_frequency.get(loc, 0) + 1
            
            top_entities = {
                'organizaciones': [
                    {'name': k, 'count': v} 
                    for k, v in sorted(org_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
                ],
                'personas': [
                    {'name': k, 'count': v} 
                    for k, v in sorted(person_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
                ],
                'lugares': [
                    {'name': k, 'count': v} 
                    for k, v in sorted(location_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
                ]
            }

            batches_stats = supabase.table('processing_batches').select('*').execute()
            
            total_batches = len(batches_stats.data)
            completed_batches = sum(1 for b in batches_stats.data if b['status'] == 'completed')
            failed_batches = sum(1 for b in batches_stats.data if b['status'] == 'failed')
            processing_batches = sum(1 for b in batches_stats.data if b['status'] == 'processing')
            
            processing_times = []
            for batch in batches_stats.data:
                if batch.get('started_at') and batch.get('completed_at'):
                    try:
                        start = datetime.fromisoformat(batch['started_at'].replace('Z', '+00:00'))
                        end = datetime.fromisoformat(batch['completed_at'].replace('Z', '+00:00'))
                        processing_times.append((end - start).total_seconds())
                    except:
                        pass
            
            avg_processing_time = round(sum(processing_times) / len(processing_times), 2) if processing_times else 0
            
            success_rate = round(
                (completed.count / total_docs.count * 100) if total_docs.count > 0 else 0,
                2
            )
            
            all_items = supabase.table('documents').select('items').execute()
            
            item_frequency = {}
            total_items = 0
            
            for doc in all_items.data:
                items = doc.get('items', [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            name = item.get('name', '')
                            if name:
                                total_items += 1
                                if name not in item_frequency:
                                    item_frequency[name] = {
                                        'name': name,
                                        'count': 0,
                                        'total_value': 0,
                                        'currency': item.get('currency', 'PEN')
                                    }
                                item_frequency[name]['count'] += 1
                                
                                try:
                                    price = float(item.get('total_price', 0) or 0)
                                    item_frequency[name]['total_value'] += price
                                except:
                                    pass
            
            top_items = sorted(item_frequency.values(), key=lambda x: x['count'], reverse=True)[:15]
            
            return JsonResponse({
                'success': True,
                'timestamp': datetime.now().isoformat(),
                'period_days': days,
                
                'overview': {
                    'total_documents': total_docs.count,
                    'pending': pending.count,
                    'completed': completed.count,
                    'processing': processing.count,
                    'failed': failed.count,
                    'success_rate': success_rate,
                    'total_storage': format_size(total_size),
                    'total_storage_bytes': total_size,
                    'total_items_cataloged': total_items
                },
                
                'documents_timeline': docs_by_day,
                'document_types': document_types,
                'top_tags': top_tags,
                'financial_summary': financial_summary,
                'recent_activity': recent_activity,
                'top_entities': top_entities,
                'processing_stats': {
                    'total_batches': total_batches,
                    'completed_batches': completed_batches,
                    'failed_batches': failed_batches,
                    'processing_batches': processing_batches,
                    'avg_processing_time_seconds': avg_processing_time,
                    'avg_processing_time_formatted': f"{int(avg_processing_time // 60)}m {int(avg_processing_time % 60)}s"
                },
                
                'top_items': top_items
            })
        
        except Exception as e:
            print(f"Error obteniendo estadísticas mejoradas: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class DebugProcessingView(View):
    
    def get(self, request):
        try:
            docs_stats = {
                'pending': supabase.table('documents').select('id', count='exact').eq('state', 'pending').execute().count,
                'processing': supabase.table('documents').select('id', count='exact').eq('state', 'processing').execute().count,
                'completed': supabase.table('documents').select('id', count='exact').eq('state', 'completed').execute().count,
                'failed': supabase.table('documents').select('id', count='exact').eq('state', 'failed').execute().count,
            }
            
            try:
                batch_stats = supabase.rpc('debug_batch_status').execute()
                batch_summary = batch_stats.data
            except Exception as e:
                print(f"No se pudo obtener estado de batches: {e}")
                batch_summary = []
            
            pending_docs = supabase.table('documents').select(
                'id, filename, batch_id, state, upload_date'
            ).eq('state', 'pending').order('upload_date', desc=False).limit(10).execute()
            
            active_batches = supabase.table('processing_batches').select('*').in_(
                'status', ['incomplete', 'ready', 'processing', 'retrying']
            ).order('created_at', desc=False).execute()
            
            return JsonResponse({
                'status': 'ok',
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'documents': docs_stats,
                'batches': {
                    'summary': batch_summary,
                    'active': active_batches.data
                },
                'pending_sample': pending_docs.data
            })
        
        except Exception as e:
            import traceback
            return JsonResponse({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=500)
    
    def post(self, request):
        """Acciones manuales de debug"""
        import json
        try:
            body = json.loads(request.body) if request.body else {}
            action = body.get('action')
            
            if action == 'force_batch_ready':
                batches = supabase.table('processing_batches').select('id').eq(
                    'status', 'incomplete'
                ).execute()
                
                count = 0
                for batch in batches.data:
                    try:
                        supabase.rpc('force_batch_ready', {'p_batch_id': batch['id']}).execute()
                        count += 1
                    except:
                        pass
                
                return JsonResponse({
                    'success': True,
                    'message': f'{count} batches marcados como ready'
                })
            
            elif action == 'mark_old_batches':
                result = batch_service.mark_old_batches_ready(minutes_old=5)
                return JsonResponse(result)
            
            else:
                return JsonResponse({
                    'error': 'Acción no válida',
                    'available_actions': ['force_batch_ready', 'mark_old_batches']
                }, status=400)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class TicketResponseView(View):
    
    def post(self, request, ticket_id):
        try:
            user_id = request.POST.get('user_id')
            message = request.POST.get('message')
            attachment_file = request.FILES.get('attachment')
            
            if not user_id or not message:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id y message son requeridos'
                }, status=400)
            
            result = support_service.add_response(
                ticket_id=ticket_id,
                user_id=user_id,
                message=message,
                is_internal_note=False,
                attachment_file=attachment_file
            )
            
            status_code = 201 if result.get('success') else 400
            return JsonResponse(result, status=status_code)
        
        except Exception as e:
            print(f"Error en respuesta de ticket: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SupportAgentTicketDetailView(View):
    
    def get(self, request, ticket_id):
        try:
            support_id = request.GET.get('support_id')
            
            if not support_id:
                return JsonResponse({
                    'success': False,
                    'error': 'support_id es requerido'
                }, status=400)
            
            result = support_service.get_ticket_detail_support(
                ticket_id=ticket_id,
                support_id=support_id
            )
            
            return JsonResponse(result)
        
        except Exception as e:
            print(f"❌ Error obteniendo detalle de ticket (agente): {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def patch(self, request, ticket_id):
        try:
            body = json.loads(request.body) if request.body else {}
            support_id = body.get('support_id')
            new_status = body.get('status')
            
            if not support_id or not new_status:
                return JsonResponse({
                    'success': False,
                    'error': 'support_id y status son requeridos'
                }, status=400)
            
            result = support_service.update_ticket_status_support(
                ticket_id=ticket_id,
                support_id=support_id,
                new_status=new_status
            )
            
            status_code = 200 if result.get('success') else 400
            return JsonResponse(result, status=status_code)
        
        except Exception as e:
            print(f"Error actualizando ticket (agente): {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SupportAgentTicketResponseView(View):
    
    def post(self, request, ticket_id):
        try:
            support_id = request.POST.get('support_id')
            message = request.POST.get('message')
            is_internal_note = request.POST.get('is_internal_note', 'false').lower() == 'true'
            attachment_file = request.FILES.get('attachment')
            
            if not support_id or not message:
                return JsonResponse({
                    'success': False,
                    'error': 'support_id y message son requeridos'
                }, status=400)
            
            result = support_service.add_response(
                ticket_id=ticket_id,
                user_id=support_id,
                message=message,
                is_internal_note=is_internal_note,
                attachment_file=attachment_file
            )
            
            status_code = 201 if result.get('success') else 400
            return JsonResponse(result, status=status_code)
        
        except Exception as e:
            print(f"Error en respuesta de ticket (agente): {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SupportAvailableTicketsView(View):
    
    def get(self, request):
        try:
            limit = int(request.GET.get('limit', 20))
            offset = int(request.GET.get('offset', 0))
            priority = request.GET.get('priority')
            status = request.GET.get('status', 'open')
            
            result = support_service.get_available_tickets(
                limit=limit,
                offset=offset,
                priority=priority,
                status=status
            )
            
            return JsonResponse(result)
        
        except Exception as e:
            print(f"❌ Error obteniendo tickets disponibles: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SupportAssignedTicketsView(View):
    
    def get(self, request):
        try:
            support_id = request.GET.get('support_id')
            limit = int(request.GET.get('limit', 20))
            offset = int(request.GET.get('offset', 0))
            status = request.GET.get('status')
            
            if not support_id:
                return JsonResponse({
                    'success': False,
                    'error': 'support_id es requerido'
                }, status=400)
            
            result = support_service.get_assigned_tickets(
                support_id=support_id,
                limit=limit,
                offset=offset,
                status=status
            )
            
            return JsonResponse(result)
        
        except Exception as e:
            print(f"❌ Error obteniendo tickets asignados: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SupportAssignTicketView(View):
    
    def post(self, request, ticket_id):
        try:
            body = json.loads(request.body) if request.body else {}
            support_id = body.get('support_id')
            
            if not support_id:
                return JsonResponse({
                    'success': False,
                    'error': 'support_id es requerido'
                }, status=400)
            
            result = support_service.assign_ticket(
                ticket_id=ticket_id,
                support_id=support_id
            )
            
            status_code = 200 if result.get('success') else 400
            return JsonResponse(result, status=status_code)
        
        except Exception as e:
            print(f"❌ Error asignando ticket: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SupportTicketDetailView(View):
    
    def get(self, request, ticket_id):
        """Obtiene el detalle de un ticket (usuario normal)"""
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id es requerido'
                }, status=400)
            
            result = support_service.get_ticket_detail(ticket_id, user_id)
            return JsonResponse(result)
        
        except Exception as e:
            print(f"❌ Error obteniendo detalle de ticket: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def patch(self, request, ticket_id):
        try:
            import json
            body = json.loads(request.body) if request.body else {}
            user_id = body.get('user_id')
            new_status = body.get('status')
            
            if not user_id or not new_status:
                return JsonResponse({
                    'success': False,
                    'error': 'user_id y status son requeridos'
                }, status=400)
            
            result = support_service.update_ticket_status(
                ticket_id=ticket_id,
                user_id=user_id,
                new_status=new_status
            )
            
            return JsonResponse(result)
        
        except Exception as e:
            print(f"❌ Error actualizando ticket: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
        
@method_decorator(csrf_exempt, name='dispatch')
class SupportTicketResponseView(View):
    
    def post(self, request, ticket_id):
        try:
            support_id = request.POST.get('support_id')
            message = request.POST.get('message')
            is_internal_note = request.POST.get('is_internal_note', 'false').lower() == 'true'
            attachment_file = request.FILES.get('attachment')
            
            if not support_id or not message:
                return JsonResponse({
                    'success': False,
                    'error': 'support_id y message son requeridos'
                }, status=400)
            
            result = support_service.add_response(
                ticket_id=ticket_id,
                user_id=support_id,
                message=message,
                is_internal_note=is_internal_note,
                attachment_file=attachment_file
            )
            
            status_code = 201 if result.get('success') else 400
            return JsonResponse(result, status=status_code)
        
        except Exception as e:
            print(f"Error en respuesta de ticket: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class DocumentVisualFeaturesView(View):
    """Endpoint para obtener solo las features visuales de un documento"""
    
    def get(self, request, document_id):
        try:
            doc = document_service.get_document_full(document_id)
            
            if not doc:
                return JsonResponse({
                    'success': False,
                    'error': 'Documento no encontrado'
                }, status=404)
            
            visual_data = {
                'document_id': document_id,
                'filename': doc.get('filename'),
                'visual_features': doc.get('visual_features', {}),
                'detected_objects': doc.get('detected_objects', []),
                'layout_analysis': doc.get('layout_analysis', {}),
                'authenticity_check': doc.get('authenticity_check', {})
            }
            
            return JsonResponse({
                'success': True,
                'visual_data': visual_data
            })
        
        except Exception as e:
            print(f"❌ Error obteniendo features visuales: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ReanalyzeVisualView(View):
    """Endpoint para re-analizar solo la parte visual de un documento"""
    
    async def post(self, request, document_id):
        try:
            doc = document_service.get_document_full(document_id)
            
            if not doc:
                return JsonResponse({
                    'success': False,
                    'error': 'Documento no encontrado'
                }, status=404)
            
            file_path = doc.get('file_path')
            if not file_path:
                return JsonResponse({
                    'success': False,
                    'error': 'Documento no tiene archivo asociado'
                }, status=400)
            
            # Descargar archivo
            success, content, error = storage_service.download_file(file_path)
            if not success:
                return JsonResponse({
                    'success': False,
                    'error': f'Error descargando archivo: {error}'
                }, status=500)
            
            # Re-analizar visualmente
            print(f"🔄 Re-analizando visualmente: {doc['filename']}")
            
            visual_analysis = await document_service.vision_service.analyze_document_visual(
                content,
                doc['file_type'],
                doc.get('extracted_text', '')[:1000]
            )
            
            # Actualizar solo campos visuales
            supabase.table('documents').update({
                'visual_features': visual_analysis.get('visual_features', {}),
                'detected_objects': visual_analysis.get('detected_objects', []),
                'layout_analysis': visual_analysis.get('layout_analysis', {}),
                'authenticity_check': visual_analysis.get('authenticity_check', {})
            }).eq('id', document_id).execute()
            
            print(f"✅ Re-análisis visual completado")
            
            return JsonResponse({
                'success': True,
                'message': 'Análisis visual actualizado',
                'visual_analysis': visual_analysis
            })
        
        except Exception as e:
            print(f"❌ Error en re-análisis visual: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)