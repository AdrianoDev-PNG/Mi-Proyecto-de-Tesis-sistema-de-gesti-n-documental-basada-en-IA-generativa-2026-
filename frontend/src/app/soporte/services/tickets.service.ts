import api from '@/app/lib/axios';
import { 
  TicketsListResponse, 
  TicketDetailResponse, 
  TicketActionResponse,
  TicketFilters,
  TicketStatus
} from '../types/soporte.type';

class TicketsService {
  async getAvailable(
    token: string,
    filters: TicketFilters = {}
  ): Promise<TicketsListResponse> {
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.offset) params.offset = filters.offset.toString();

      const response = await api.get('/api/documents/support/agent/available/', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: unknown) {
      console.error('Error en getAvailable:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        return {
          success: false,
          tickets: [],
          count: 0,
          pagination: {
            total: 0,
            limit: filters.limit || 20,
            offset: filters.offset || 0,
            current_page: 1,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
          error: axiosError.response?.data?.detail || 'Error al cargar tickets disponibles',
        };
      }
      
      return {
        success: false,
        tickets: [],
        count: 0,
        pagination: {
          total: 0,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          current_page: 1,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
        error: 'Error de conexión con el servidor',
      };
    }
  }

  async getAssigned(
    token: string,
    supportId: string,
    filters: TicketFilters = {}
  ): Promise<TicketsListResponse> {
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.offset) params.offset = filters.offset.toString();
      params.support_id = supportId;

      const response = await api.get('/api/documents/support/agent/assigned/', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: unknown) {
      console.error('Error en getAssigned:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        return {
          success: false,
          tickets: [],
          count: 0,
          pagination: {
            total: 0,
            limit: filters.limit || 20,
            offset: filters.offset || 0,
            current_page: 1,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
          error: axiosError.response?.data?.detail || 'Error al cargar tickets asignados',
        };
      }
      
      return {
        success: false,
        tickets: [],
        count: 0,
        pagination: {
          total: 0,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          current_page: 1,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
        error: 'Error de conexión con el servidor',
      };
    }
  }

  async getDetail(
    ticketId: string,
    supportId: string,
    token: string
  ): Promise<TicketDetailResponse> {
    try {
      const response = await api.get(
        `/api/documents/support/agent/tickets/${ticketId}/`,
        {
          params: {
            support_id: supportId
          },
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error en getDetail:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        return {
          success: false,
          ticket: {
            id: '',
            user_id: '',
            subject: '',
            description: '',
            priority: 'medium',
            status: 'open',
            created_at: '',
            updated_at: '',
            user_contact: null,
            responses: [],
          },
          error: axiosError.response?.data?.detail || 'Error al cargar detalle del ticket',
        };
      }
      
      return {
        success: false,
        ticket: {
          id: '',
          user_id: '',
          subject: '',
          description: '',
          priority: 'medium',
          status: 'open',
          created_at: '',
          updated_at: '',
          user_contact: null,
          responses: [],
        },
        error: 'Error de conexión con el servidor',
      };
    }
  }

  async assignToSelf(
    ticketId: string,
    supportId: string,
    token: string
  ): Promise<TicketActionResponse> {
    try {
      const response = await api.post(
        `/api/documents/support/agent/tickets/${ticketId}/assign/`,
        { support_id: supportId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error en assignToSelf:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        return {
          success: false,
          error: axiosError.response?.data?.detail || 'Error al asignar ticket',
        };
      }
      
      return {
        success: false,
        error: 'Error de conexión con el servidor',
      };
    }
  }

  async updateStatus(
    ticketId: string,
    supportId: string,
    newStatus: TicketStatus,
    token: string
  ): Promise<TicketActionResponse> {
    try {
      const response = await api.patch(
        `/api/documents/support/agent/tickets/${ticketId}/`,
        {
          support_id: supportId,
          status: newStatus,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error en updateStatus:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        return {
          success: false,
          error: axiosError.response?.data?.detail || 'Error al actualizar estado',
        };
      }
      
      return {
        success: false,
        error: 'Error de conexión con el servidor',
      };
    }
  }

  async addResponse(
    ticketId: string,
    supportId: string,
    message: string,
    isInternalNote: boolean = false,
    attachment?: File,
    token?: string
  ): Promise<TicketActionResponse> {
    try {
      if (!token) {
        return {
          success: false,
          error: 'Token de autenticación no disponible',
        };
      }

      const formData = new FormData();
      formData.append('support_id', supportId);
      formData.append('message', message);
      formData.append('is_internal_note', isInternalNote.toString());
      
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await api.post(
        `/api/documents/support/agent/tickets/${ticketId}/responses/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error en addResponse:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        return {
          success: false,
          error: axiosError.response?.data?.detail || 'Error al enviar respuesta',
        };
      }
      
      return {
        success: false,
        error: 'Error de conexión con el servidor',
      };
    }
  }
}

export const ticketsService = new TicketsService();