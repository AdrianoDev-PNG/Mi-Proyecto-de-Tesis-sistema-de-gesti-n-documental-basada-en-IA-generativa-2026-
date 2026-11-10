from typing import Dict, Any, Optional, List
from datetime import datetime
from django.conf import settings

class SupportService:
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
        self.bucket_name = "support-attachments"
        self._ensure_bucket_exists()
        print("SupportService inicializado")
    
    def _ensure_bucket_exists(self):
        try:
            self.supabase.storage.get_bucket(self.bucket_name)
            print(f"Bucket '{self.bucket_name}' existe")
        except Exception:
            try:
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={"public": False}
                )
                print(f"✓ Bucket '{self.bucket_name}' creado")
            except Exception as e:
                print(f"Error creando bucket: {e}")
    
    def create_ticket(
        self,
        user_id: str,
        subject: str,
        description: str,
        priority: str = 'medium',
        attachment_file: Optional[bytes] = None,
        attachment_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            if priority not in ['low', 'medium', 'high', 'critical']:
                return {
                    'success': False,
                    'error': 'Prioridad inválida. Debe ser: low, medium, high o critical'
                }
            
            attachment_url = None
            if attachment_file and attachment_filename:
                attachment_url = self._upload_attachment(
                    user_id,
                    attachment_file,
                    attachment_filename
                )
                if not attachment_url:
                    print("Error subiendo archivo adjunto, continuando sin él")
            
            result = self.supabase.table('support_tickets').insert({
                'user_id': user_id,
                'subject': subject,
                'description': description,
                'priority': priority,
                'status': 'open',
                'attachment_url': attachment_url,
                'created_at': datetime.now().isoformat()
            }).execute()
            
            ticket = result.data[0]
            ticket_id = ticket['id']
            
            print(f"✓ Ticket creado: {ticket_id[:8]}... (Prioridad: {priority})")
            
            return {
                'success': True,
                'ticket': ticket,
                'ticket_id': ticket_id,
                'message': 'Ticket creado exitosamente. Te contactaremos pronto.'
            }
        
        except Exception as e:
            print(f"✗ Error creando ticket: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _upload_attachment(
        self,
        user_id: str,
        file_content: bytes,
        filename: str
    ) -> Optional[str]:
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_filename = f"{user_id[:8]}_{timestamp}_{filename}"
            file_path = f"{user_id}/{safe_filename}"
            
            content_type = 'image/png'
            if filename.lower().endswith(('.jpg', '.jpeg')):
                content_type = 'image/jpeg'
            elif filename.lower().endswith('.pdf'):
                content_type = 'application/pdf'
            
            self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": content_type,
                    "upsert": "false"
                }
            )
            
            signed_url_result = self.supabase.storage.from_(self.bucket_name)\
                .create_signed_url(
                    path=file_path,
                    expires_in=604800
                )
            
            print(f"Adjunto subido: {file_path}")
            return signed_url_result.get('signedURL')
        
        except Exception as e:
            print(f"Error subiendo adjunto: {e}")
            return None
    
    def _get_user_info(self, user_id: str) -> Dict[str, Any]:
        try:
            result = self.supabase.table('users')\
                .select('username, email, full_name, role')\
                .eq('id', user_id)\
                .single()\
                .execute()
            return result.data
        except Exception as e:
            print(f"Error obteniendo info de usuario: {e}")
            return {
                'username': 'Usuario',
                'email': 'no-disponible@example.com',
                'full_name': 'Usuario',
                'role': 'usuario'
            }
    
    def get_user_tickets(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        try:
            query = self.supabase.table('support_tickets')\
                .select('*', count='exact')\
                .eq('user_id', user_id)
            
            if status:
                if status not in ['open', 'in_progress', 'resolved', 'closed']:
                    return {
                        'success': False,
                        'error': 'Estado inválido'
                    }
                query = query.eq('status', status)
            
            count_result = query.execute()
            total_count = count_result.count if hasattr(count_result, 'count') else 0
            
            result = self.supabase.table('support_tickets')\
                .select('*')\
                .eq('user_id', user_id)
            
            if status:
                result = result.eq('status', status)
            
            result = result.order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            tickets = result.data
            
            for ticket in tickets:
                response_count = self.supabase.table('ticket_responses')\
                    .select('id', count='exact')\
                    .eq('ticket_id', ticket['id'])\
                    .eq('is_internal_note', False)\
                    .execute()
                ticket['response_count'] = response_count.count if hasattr(response_count, 'count') else 0
            
            total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
            current_page = (offset // limit) + 1
            has_next = (offset + limit) < total_count
            has_previous = offset > 0
            
            print(f"✓ Tickets recuperados: {len(tickets)} (total: {total_count})")
            
            return {
                'success': True,
                'tickets': tickets,
                'count': len(tickets),
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
            print(f"Error obteniendo tickets: {e}")
            return {
                'success': False,
                'error': str(e),
                'tickets': [],
                'count': 0,
                'pagination': {}
            }
    
    def get_ticket_detail(self, ticket_id: str, user_id: str) -> Dict[str, Any]:
        try:
            result = self.supabase.table('support_tickets')\
                .select('*')\
                .eq('id', ticket_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Ticket no encontrado o no autorizado'
                }
            
            ticket = result.data
            
            if ticket.get('attachment_url') and 'expires=' in ticket['attachment_url']:
                ticket['attachment_url'] = self._refresh_attachment_url(ticket['attachment_url'])
            
            responses_result = self.supabase.table('ticket_responses')\
                .select('*, users!inner(username, full_name, role)')\
                .eq('ticket_id', ticket_id)\
                .eq('is_internal_note', False)\
                .order('created_at', desc=False)\
                .execute()
            
            responses = []
            for resp in responses_result.data:
                user_data = resp.get('users', {})
                responses.append({
                    'id': resp['id'],
                    'message': resp['message'],
                    'attachment_url': resp.get('attachment_url'),
                    'created_at': resp['created_at'],
                    'user': {
                        'username': user_data.get('username'),
                        'full_name': user_data.get('full_name'),
                        'role': user_data.get('role')
                    }
                })
            
            ticket['responses'] = responses
            
            print(f"Detalle de ticket recuperado: {ticket_id[:8]}...")
            
            return {
                'success': True,
                'ticket': ticket
            }
        
        except Exception as e:
            print(f"Error obteniendo detalle de ticket: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _refresh_attachment_url(self, old_url: str) -> str:
        try:
            if '/sign/' in old_url:
                parts = old_url.split('/sign/')[1].split('?')[0]
                bucket_and_path = parts.split('/', 1)
                if len(bucket_and_path) == 2:
                    file_path = bucket_and_path[1]
                    
                    signed_url_result = self.supabase.storage.from_(self.bucket_name)\
                        .create_signed_url(
                            path=file_path,
                            expires_in=604800
                        )
                    
                    return signed_url_result.get('signedURL', old_url)
        except Exception as e:
            print(f"Error refrescando URL: {e}")
        
        return old_url
    
    def update_ticket_status(
        self,
        ticket_id: str,
        user_id: str,
        new_status: str
    ) -> Dict[str, Any]:
        try:
            if new_status != 'closed':
                return {
                    'success': False,
                    'error': 'Solo puedes cerrar tus propios tickets'
                }
            
            update_data = {
                'status': new_status,
                'updated_at': datetime.now().isoformat(),
                'closed_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('support_tickets')\
                .update(update_data)\
                .eq('id', ticket_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Ticket no encontrado o no autorizado'
                }
            
            print(f"Estado de ticket actualizado: {ticket_id[:8]}... -> {new_status}")
            
            return {
                'success': True,
                'ticket': result.data[0],
                'message': 'Estado del ticket actualizado'
            }
        
        except Exception as e:
            print(f"✗ Error actualizando ticket: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def add_response(
        self,
        ticket_id: str,
        user_id: str,
        message: str,
        is_internal_note: bool = False,
        attachment_file = None
    ) -> Dict[str, Any]:
        try:
            ticket_check = self.supabase.table('support_tickets')\
                .select('id, user_id')\
                .eq('id', ticket_id)\
                .single()\
                .execute()
            
            if not ticket_check.data:
                return {
                    'success': False,
                    'error': 'Ticket no encontrado'
                }
            
            attachment_url = None
            if attachment_file:
                filename = attachment_file.name if hasattr(attachment_file, 'name') else 'attachment'
                if hasattr(attachment_file, 'read'):
                    file_content = attachment_file.read()
                else:
                    file_content = attachment_file
                
                attachment_url = self._upload_attachment(
                    user_id,
                    file_content,
                    filename
                )
            
            result = self.supabase.table('ticket_responses').insert({
                'ticket_id': ticket_id,
                'user_id': user_id,
                'message': message,
                'is_internal_note': is_internal_note,
                'attachment_url': attachment_url,
                'created_at': datetime.now().isoformat()
            }).execute()
            
            response = result.data[0]
            
            print(f"Respuesta agregada al ticket {ticket_id[:8]}...")
            
            return {
                'success': True,
                'response': response,
                'message': 'Respuesta agregada exitosamente'
            }
        
        except Exception as e:
            print(f"Error agregando respuesta: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_available_tickets(
        self,
        limit: int = 20,
        offset: int = 0,
        priority: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            query = self.supabase.table('support_tickets')\
                .select('*', count='exact')\
                .is_('assigned_to', 'null')
            
            if status:
                if status not in ['open', 'in_progress', 'resolved', 'closed']:
                    return {
                        'success': False,
                        'error': 'Estado inválido'
                    }
                query = query.eq('status', status)
            else:
                query = query.in_('status', ['open'])
            
            if priority:
                if priority not in ['low', 'medium', 'high', 'critical']:
                    return {
                        'success': False,
                        'error': 'Prioridad inválida'
                    }
                query = query.eq('priority', priority)
            
            count_result = query.execute()
            total_count = count_result.count if hasattr(count_result, 'count') else 0
            
            result = self.supabase.table('support_tickets')\
                .select('*')\
                .is_('assigned_to', 'null')
            
            if status:
                result = result.eq('status', status)
            else:
                result = result.in_('status', ['open'])
            
            if priority:
                result = result.eq('priority', priority)
            
            result = result.order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            tickets = result.data
            
            total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
            current_page = (offset // limit) + 1
            has_next = (offset + limit) < total_count
            has_previous = offset > 0
            
            print(f"Tickets disponibles recuperados: {len(tickets)} (total: {total_count})")
            
            return {
                'success': True,
                'tickets': tickets,
                'count': len(tickets),
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
            print(f"✗ Error obteniendo tickets disponibles: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e),
                'tickets': [],
                'count': 0,
                'pagination': {}
            }

    def get_assigned_tickets(
        self,
        support_id: str,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            user = self._get_user_info(support_id)
            if user.get('role') not in ['soporte', 'administrador']:
                return {
                    'success': False,
                    'error': 'Solo usuarios con rol soporte pueden ver tickets asignados'
                }
            
            query = self.supabase.table('support_tickets')\
                .select('*', count='exact')\
                .eq('assigned_to', support_id)
            
            if status:
                if status not in ['open', 'in_progress', 'resolved', 'closed']:
                    return {
                        'success': False,
                        'error': 'Estado inválido'
                    }
                query = query.eq('status', status)
            
            count_result = query.execute()
            total_count = count_result.count if hasattr(count_result, 'count') else 0
            
            result = self.supabase.table('support_tickets')\
                .select('*')\
                .eq('assigned_to', support_id)
            
            if status:
                result = result.eq('status', status)
            
            result = result.order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            tickets = result.data
            
            total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
            current_page = (offset // limit) + 1
            has_next = (offset + limit) < total_count
            has_previous = offset > 0
            
            print(f"✓ Tickets asignados recuperados: {len(tickets)} (total: {total_count})")
            
            return {
                'success': True,
                'tickets': tickets,
                'count': len(tickets),
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
            print(f"Error obteniendo tickets asignados: {e}")
            return {
                'success': False,
                'error': str(e),
                'tickets': [],
                'count': 0,
                'pagination': {}
            }

    def assign_ticket(
        self,
        ticket_id: str,
        support_id: str
    ) -> Dict[str, Any]:
        try:
            support_user = self._get_user_info(support_id)
            if support_user.get('role') not in ['soporte', 'administrador']:
                return {
                    'success': False,
                    'error': 'Solo usuarios con rol soporte pueden asignar tickets'
                }
            
            ticket_check = self.supabase.table('support_tickets')\
                .select('id, assigned_to, status')\
                .eq('id', ticket_id)\
                .single()\
                .execute()
            
            if not ticket_check.data:
                return {
                    'success': False,
                    'error': 'Ticket no encontrado'
                }
            
            if ticket_check.data.get('assigned_to'):
                return {
                    'success': False,
                    'error': 'Ticket ya está asignado a otro agente'
                }
            
            update_data = {
                'assigned_to': support_id,
                'assigned_at': datetime.now().isoformat(),
                'status': 'in_progress',
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('support_tickets')\
                .update(update_data)\
                .eq('id', ticket_id)\
                .execute()
            
            print(f"✓ Ticket {ticket_id[:8]}... asignado a {support_user.get('username')}")
            
            return {
                'success': True,
                'ticket': result.data[0],
                'message': 'Ticket asignado exitosamente'
            }
        
        except Exception as e:
            print(f"✗ Error asignando ticket: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }

    def update_ticket_status_support(
        self,
        ticket_id: str,
        support_id: str,
        new_status: str
    ) -> Dict[str, Any]:
        try:
            if new_status not in ['open', 'in_progress', 'resolved', 'closed']:
                return {
                    'success': False,
                    'error': 'Estado inválido'
                }
            
            support_user = self._get_user_info(support_id)
            if support_user.get('role') not in ['soporte', 'administrador']:
                return {
                    'success': False,
                    'error': 'Solo usuarios con rol soporte pueden actualizar tickets'
                }
            
            ticket_check = self.supabase.table('support_tickets')\
                .select('id, assigned_to, status')\
                .eq('id', ticket_id)\
                .single()\
                .execute()
            
            if not ticket_check.data:
                return {
                    'success': False,
                    'error': 'Ticket no encontrado'
                }
            
            if ticket_check.data.get('assigned_to') != support_id:
                return {
                    'success': False,
                    'error': 'Solo puedes actualizar tickets asignados a ti'
                }
            
            if ticket_check.data.get('status') == 'closed':
                return {
                    'success': False,
                    'error': 'No se puede modificar un ticket cerrado'
                }
            
            update_data = {
                'status': new_status,
                'updated_at': datetime.now().isoformat()
            }
            
            if new_status == 'resolved':
                update_data['resolved_at'] = datetime.now().isoformat()
            elif new_status == 'closed':
                update_data['closed_at'] = datetime.now().isoformat()
                if not ticket_check.data.get('resolved_at'):
                    update_data['resolved_at'] = datetime.now().isoformat()
            
            result = self.supabase.table('support_tickets')\
                .update(update_data)\
                .eq('id', ticket_id)\
                .execute()
            
            print(f"✓ Estado de ticket actualizado: {ticket_id[:8]}... -> {new_status}")
            
            return {
                'success': True,
                'ticket': result.data[0],
                'message': 'Estado del ticket actualizado'
            }
        
        except Exception as e:
            print(f"✗ Error actualizando ticket: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_ticket_detail_support(
        self, 
        ticket_id: str, 
        support_id: str
    ) -> Dict[str, Any]:
        """
        Obtiene detalle de ticket para agente de soporte.
        Permite ver tickets asignados O tickets sin asignar (disponibles).
        """
        try:
            support_user = self._get_user_info(support_id)
            if support_user.get('role') not in ['soporte', 'administrador']:
                return {
                    'success': False,
                    'error': 'Solo usuarios con rol soporte pueden ver detalles de tickets'
                }
            
            result = self.supabase.table('support_tickets')\
                .select('*')\
                .eq('id', ticket_id)\
                .single()\
                .execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Ticket no encontrado'
                }
            
            ticket = result.data
            
            if ticket.get('assigned_to') and ticket.get('assigned_to') != support_id:
                return {
                    'success': False,
                    'error': 'Este ticket está asignado a otro agente'
                }
            
            if ticket.get('user_id'):
                user_info = self._get_user_info(ticket['user_id'])
                ticket['user_contact'] = {
                    'user_id': ticket['user_id'],
                    'username': user_info.get('username'),
                    'email': user_info.get('email'),
                    'full_name': user_info.get('full_name'),
                    'role': user_info.get('role')
                }
            else:
                ticket['user_contact'] = None
            
            if ticket.get('attachment_url') and 'expires=' in ticket['attachment_url']:
                ticket['attachment_url'] = self._refresh_attachment_url(ticket['attachment_url'])
            
            responses_result = self.supabase.table('ticket_responses')\
                .select('*, users!inner(username, full_name, role)')\
                .eq('ticket_id', ticket_id)\
                .order('created_at', desc=False)\
                .execute()
            
            responses = []
            for resp in responses_result.data:
                user_data = resp.get('users', {})
                responses.append({
                    'id': resp['id'],
                    'message': resp['message'],
                    'is_internal_note': resp.get('is_internal_note', False),
                    'attachment_url': resp.get('attachment_url'),
                    'created_at': resp['created_at'],
                    'user': {
                        'username': user_data.get('username'),
                        'full_name': user_data.get('full_name'),
                        'role': user_data.get('role')
                    }
                })
            
            ticket['responses'] = responses
            
            print(f"Detalle de ticket (soporte) recuperado: {ticket_id[:8]}...")
            print(f"   Asignado a: {ticket.get('assigned_to') or 'Sin asignar'}")
            if ticket.get('user_contact'):
                print(f"   Usuario: {ticket['user_contact'].get('full_name')} ({ticket['user_contact'].get('email')})")
            
            return {
                'success': True,
                'ticket': ticket
            }
        
        except Exception as e:
            print(f"✗ Error obteniendo detalle de ticket (soporte): {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }