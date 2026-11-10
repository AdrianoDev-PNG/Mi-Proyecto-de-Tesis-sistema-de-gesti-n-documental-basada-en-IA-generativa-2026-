import apiUser from "@/app/lib/axios";
import {
  CreateTicketRequest,
  CreateTicketResponse,
  TicketsListResponse,
  TicketDetailResponse,
  UpdateTicketStatusRequest,
  UpdateTicketStatusResponse,
  AddTicketResponseRequest,
  AddTicketResponseResponse,
  AvailableTicketsResponse,
  AssignedTicketsResponse,
  AssignTicketRequest,
  AssignTicketResponse,
  UpdateTicketStatusSupportRequest,
  UpdateTicketStatusSupportResponse,
  AddTicketResponseSupportRequest,
  AddTicketResponseSupportResponse,
  TicketDetailSupportResponse,
} from "../types/types";

export const soporteService = {
  async createTicket(
    ticket: CreateTicketRequest,
    token: string
  ): Promise<CreateTicketResponse> {
    const formData = new FormData();
    formData.append("user_id", ticket.user_id);
    formData.append("subject", ticket.subject);
    formData.append("description", ticket.description);
    formData.append("priority", ticket.priority || "medium");

    if (ticket.attachment_file) {
      formData.append("attachment", ticket.attachment_file);
    }

    const response = await apiUser.post(
      "/api/documents/support/tickets/",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async listTickets(
    userId: string,
    token: string,
    options?: {
      status?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<TicketsListResponse> {
    let url = `/api/documents/support/tickets/?user_id=${userId}`;

    if (options?.status) {
      url += `&status=${options.status}`;
    }
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }
    if (options?.page) {
      url += `&page=${options.page}`;
    }

    const response = await apiUser.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getTicketDetail(
    ticketId: string,
    userId: string,
    token: string
  ): Promise<TicketDetailResponse> {
    const response = await apiUser.get(
      `/api/documents/support/tickets/${ticketId}/?user_id=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async updateTicketStatus(
    ticketId: string,
    request: UpdateTicketStatusRequest,
    token: string
  ): Promise<UpdateTicketStatusResponse> {
    const response = await apiUser.patch(
      `/api/documents/support/tickets/${ticketId}/`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async addResponse(
    ticketId: string,
    request: AddTicketResponseRequest,
    token: string
  ): Promise<AddTicketResponseResponse> {
    const formData = new FormData();
    formData.append("user_id", request.user_id);
    formData.append("message", request.message);

    if (request.attachment_file) {
      formData.append("attachment", request.attachment_file);
    }

    const response = await apiUser.post(
      `/api/documents/support/tickets/${ticketId}/responses/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};

export const soporteAgentService = {
  async getAvailableTickets(
    token: string,
    options?: {
      priority?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AvailableTicketsResponse> {
    let url = "/api/documents/support/agent/available/?";

    const params = new URLSearchParams();
    if (options?.priority) params.append("priority", options.priority);
    if (options?.status) params.append("status", options.status);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    url += params.toString();

    const response = await apiUser.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getAssignedTickets(
    supportId: string,
    token: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AssignedTicketsResponse> {
    let url = `/api/documents/support/agent/assigned/?support_id=${supportId}`;

    if (options?.status) {
      url += `&status=${options.status}`;
    }
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }
    if (options?.offset) {
      url += `&offset=${options.offset}`;
    }

    const response = await apiUser.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async assignTicket(
    ticketId: string,
    request: AssignTicketRequest,
    token: string
  ): Promise<AssignTicketResponse> {
    const response = await apiUser.post(
      `/api/documents/support/agent/tickets/${ticketId}/assign/`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getTicketDetail(
    ticketId: string,
    supportId: string,
    token: string
  ): Promise<TicketDetailSupportResponse> {
    const response = await apiUser.get(
      `/api/documents/support/agent/tickets/${ticketId}/?support_id=${supportId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async updateTicketStatus(
    ticketId: string,
    request: UpdateTicketStatusSupportRequest,
    token: string
  ): Promise<UpdateTicketStatusSupportResponse> {
    const response = await apiUser.patch(
      `/api/documents/support/agent/tickets/${ticketId}/`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async addResponse(
    ticketId: string,
    request: AddTicketResponseSupportRequest,
    token: string
  ): Promise<AddTicketResponseSupportResponse> {
    const formData = new FormData();
    formData.append("support_id", request.support_id);
    formData.append("message", request.message);

    if (request.is_internal_note !== undefined) {
      formData.append("is_internal_note", request.is_internal_note.toString());
    }

    if (request.attachment_file) {
      formData.append("attachment", request.attachment_file);
    }

    const response = await apiUser.post(
      `/api/documents/support/agent/tickets/${ticketId}/responses/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};