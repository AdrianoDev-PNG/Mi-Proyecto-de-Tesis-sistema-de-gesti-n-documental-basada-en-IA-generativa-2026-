// src/app/soporte/types/soporte.types.ts
export interface SupportUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: 'soporte' | 'administrador';
  created_at?: string;
  last_login?: string;
}

export interface SupportUserResponse {
  user: SupportUser;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  attachment_url?: string;
  assigned_to?: string;
  assigned_at?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  
  creator_username?: string;
  creator_email?: string;
  creator_name?: string;
  assigned_username?: string;
  response_count?: number;
  last_response_at?: string;
}

export interface TicketUserContact {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
}

export interface TicketResponse {
  id: string;
  message: string;
  is_internal_note: boolean;
  attachment_url?: string;
  created_at: string;
  user: {
    username: string;
    full_name?: string;
    role: string;
  };
}

export interface SupportTicketDetail extends SupportTicket {
  user_contact: TicketUserContact | null;
  responses: TicketResponse[];
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_offset?: number;
  previous_offset?: number;
}

export interface TicketsListResponse {
  success: boolean;
  tickets: SupportTicket[];
  count: number;
  pagination: PaginationInfo;
  error?: string;
}

export interface TicketDetailResponse {
  success: boolean;
  ticket: SupportTicketDetail;
  error?: string;
}

export interface TicketActionResponse {
  success: boolean;
  ticket?: SupportTicket;
  response?: TicketResponse;
  message?: string;
  error?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  limit?: number;
  offset?: number;
}

export interface AssignTicketRequest {
  support_id: string;
}

export interface UpdateTicketStatusRequest {
  support_id: string;
  status: TicketStatus;
}

export interface AddResponseRequest {
  support_id: string;
  message: string;
  is_internal_note?: boolean;
  attachment?: File;
}
export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  my_tickets: number;
  avg_response_time?: string;
}
export const TICKET_STATUS: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
} as const;

export const TICKET_PRIORITY: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
} as const;

export type PriorityColorType = 'blue' | 'yellow' | 'orange' | 'red';
export type StatusColorType = 'blue' | 'purple' | 'green' | 'gray';

export const PRIORITY_COLORS: Record<TicketPriority, PriorityColorType> = {
  low: 'blue',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
} as const;

export const STATUS_COLORS: Record<TicketStatus, StatusColorType> = {
  open: 'blue',
  in_progress: 'purple',
  resolved: 'green',
  closed: 'gray',
} as const;