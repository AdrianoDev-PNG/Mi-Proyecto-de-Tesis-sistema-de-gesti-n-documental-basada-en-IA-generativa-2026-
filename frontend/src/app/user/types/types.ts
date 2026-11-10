export interface UserMeData {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  created_at?: string;
}

export interface UserMeResponse {
  user: UserMeData;
}

export interface DocumentItem {
  name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  type: string;
}

export interface DocumentMetadata {
  ruc?: string;
  issuer?: string;
  receiver?: string;
  date?: string;
  currency?: string;
  invoice_number?: string;
  total_amount?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface DocumentTag {
  tag: string;
  category?: string;
  confidence?: number;
}

export interface DocumentEntities {
  lugares?: string[];
  organizaciones?: string[];
  personas?: string[];
  fechas?: string[];
  [key: string]: string[] | undefined;
}

export interface DocumentSummaryObject {
  summary: string;
  language?: string;
  page_count?: number;
  word_count?: number;
}

export interface Document {
  id: string;
  filename: string;
  state: string;
  upload_date: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  user_id?: string;
  username?: string;
  email?: string;
}

export interface DocumentDetail extends Document {
  batch_id?: string;
  batch_status?: string;
  currency?: string;
  download_url?: string;
  error_message?: string | null;
  file_hash?: string;
  items?: DocumentItem[];
  language?: string | null;
  metadata?: DocumentMetadata;
  entities?: DocumentEntities;
  page_count?: number;
  processed_at?: string;
  summary?: string | DocumentSummaryObject;
  tags?: DocumentTag[];
  total_amount?: string | number;
  word_count?: number;
  extracted_text?: string;
}

export interface DocumentDetailResponse {
  document: DocumentDetail;
}

export interface Stats {
  total_documents: number;
  pending: number;
  completed: number;
  processing: number;
  failed: number;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_offset: number | null;
  previous_offset: number | null;
}

export interface DocumentsResponse {
  success: boolean;
  documents: Document[];
  count: number;
  pagination: Pagination;
  filters_applied?: {
    state?: string;
    batch_id?: string;
  };
  info?: string;
}

export interface UploadResponse {
  message: string;
  documents: Document[];
}

export interface SearchFilters {
  search_phrase?: string;
  productos?: string[];
  marcas?: string[];
  categorias?: string[];
  precio_min?: number;
  precio_max?: number;
  moneda?: string;
  ubicacion?: string;
  tipo_documento?: string;
  keywords?: string[];
  date_range?: string;
}

export interface SearchCriteria {
  intent: string;
  filters: SearchFilters;
  search_type: string;
  description: string;
}

export interface SearchResult {
  document: {
    id: string;
    filename: string;
    user_id: string;
    batch_id?: string;
    file_type: string;
    file_size: number;
    file_hash: string;
    file_path: string;
    state: string;
    upload_date: string;
    processed_at?: string;
    document_type?: string;
    metadata?: DocumentMetadata;
    tags?: DocumentTag[];
    entities?: DocumentEntities;
    summary?: DocumentSummaryObject;
    items?: DocumentItem[];
  };
  score: number;
  matches: string[];
  match_count: number;
}

export interface IntelligentSearchResponse {
  query: string;
  search_criteria: SearchCriteria;
  results: SearchResult[];
  count: number;
}

export interface ItemSearchResult {
  document_id: string;
  filename: string;
  upload_date: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  description?: string;
}

export interface ItemSearchResponse {
  items: ItemSearchResult[];
  count: number;
}

export interface BulkDownloadRequest {
  document_ids: string[];
  format: 'zip' | 'rar';
  archive_name: string;
}

export interface BulkDownloadResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ExportColumn {
  key: string;
  label: string;
  width: string;
  visible: boolean;
}

export interface ExportTableRow {
  [key: string]: string | number;
}

export interface ExportSearchResultsRequest {
  table_data: ExportTableRow[];
  columns: ExportColumn[];
  query: string;
}

export interface SearchHistoryFilters {
  search_phrase?: string | null;
  precio_min?: number | null;
  precio_max?: number | null;
  precio_type?: string | null;
  moneda?: string | null;
  tipo_documento?: string | null;
  date_range?: string | null;
  keywords?: string[];
}

export interface SearchHistoryResultDetails {
  execution_time_seconds: number;
  search_type: string;
  intent: string;
  filters_applied: SearchHistoryFilters;
  document_count: number;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  search_query: string;
  search_filters: SearchHistoryFilters;
  found_document_count: number;
  found_document_ids: string[];
  result_details: SearchHistoryResultDetails;
  executed_at: string;
}

export interface SearchHistoryResponse {
  success: boolean;
  searches: SearchHistoryItem[];
  count: number;
  pagination: Pagination;
}

export interface SearchHistoryDetailResponse {
  success: boolean;
  search: SearchHistoryItem;
  documents: DocumentDetail[];
  document_count: number;
}

export interface PopularSearch {
  query: string;
  count: number;
  total_docs_found: number;
}

export interface PopularSearchesResponse {
  success: boolean;
  popular_searches: PopularSearch[];
  count: number;
}

export interface DeleteSearchResponse {
  success: boolean;
  message: string;
}

export interface ClearHistoryResponse {
  success: boolean;
  message: string;
  deleted_count: number;
}
export interface DeleteDocumentsRequest {
  document_ids: string[];
  user_id: string;
  delete_storage?: boolean;
}

export interface DeletedDocument {
  document_id: string;
  filename: string;
  storage_deleted: boolean;
  storage_error: string | null;
}

export interface FailedDocument {
  document_id: string;
  filename: string;
  error: string;
}

export interface StorageDeletedInfo {
  document_id: string;
  file_path: string;
}

export interface StorageFailedInfo {
  document_id: string;
  file_path: string;
  error: string;
}

export interface DeleteDocumentsResponse {
  success: boolean;
  message: string;
  summary: {
    requested: number;
    found: number;
    not_found: number;
    unauthorized: number;
    deleted: number;
    failed: number;
    storage_deleted: number;
    storage_failed: number;
  };
  results: {
    deleted: DeletedDocument[];
    failed: FailedDocument[];
    storage_deleted: StorageDeletedInfo[];
    storage_failed: StorageFailedInfo[];
  };
  warnings: {
    not_found: string[];
    unauthorized: string[];
  };
}

export interface DeleteSingleDocumentResponse {
  success: boolean;
  message: string;
  document_id: string;
  storage_deleted: boolean;
}

export interface TicketUser {
  username: string;
  full_name?: string;
  role: string;
}

export interface TicketResponse {
  id: string;
  message: string;
  attachment_url?: string | null;
  created_at: string;
  user: TicketUser;
  is_internal_note?: boolean;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachment_url?: string | null;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  assigned_to?: string | null;
  assigned_admin?: TicketUser | null;
  response_count?: number;
}

export interface SupportTicketDetail extends SupportTicket {
  responses: TicketResponse[];
    user_contact?: {
    user_id: string;
    username: string;
    email: string;
    full_name?: string;
    role: string;
  };
}

export interface CreateTicketRequest {
  user_id: string;
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  attachment_file?: File;
}

export interface CreateTicketResponse {
  success: boolean;
  ticket?: SupportTicket;
  ticket_id?: string;
  message?: string;
  error?: string;
}

export interface TicketsListResponse {
  success: boolean;
  tickets: SupportTicket[];
  count: number;
  pagination: Pagination;
}

export interface TicketDetailResponse {
  success: boolean;
  ticket: SupportTicketDetail;
}

export interface UpdateTicketStatusRequest {
  user_id: string;
  status: 'closed';
}

export interface UpdateTicketStatusResponse {
  success: boolean;
  ticket?: SupportTicket;
  message?: string;
  error?: string;
}

export interface AddTicketResponseRequest {
  user_id: string;
  message: string;
  attachment_file?: File;
}

export interface AddTicketResponseResponse {
  success: boolean;
  response?: TicketResponse;
  message?: string;
  error?: string;
}

export interface AvailableTicketsResponse {
  success: boolean;
  tickets: SupportTicket[];
  count: number;
  pagination: Pagination;
}

export interface AssignedTicketsResponse {
  success: boolean;
  tickets: SupportTicket[];
  count: number;
  pagination: Pagination;
}

export interface AssignTicketRequest {
  support_id: string;
}

export interface AssignTicketResponse {
  success: boolean;
  ticket?: SupportTicket;
  message?: string;
  error?: string;
}

export interface UpdateTicketStatusSupportRequest {
  support_id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export interface UpdateTicketStatusSupportResponse {
  success: boolean;
  ticket?: SupportTicket;
  message?: string;
  error?: string;
}

export interface AddTicketResponseSupportRequest {
  support_id: string;
  message: string;
  is_internal_note?: boolean;
  attachment_file?: File;
}

export interface AddTicketResponseSupportResponse {
  success: boolean;
  response?: TicketResponse;
  message?: string;
  error?: string;
}

export interface TicketDetailSupportResponse {
  success: boolean;
  ticket: SupportTicketDetail;
}

export interface DocumentVisualFeatures {
  document_quality?: string;
  has_watermark?: boolean;
  predominant_colors?: string[];
  text_clarity?: string;
  has_handwriting?: boolean;
  visual_complexity?: string;
}

export interface DetectedObjectDetails {
  rows?: number;
  columns?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface DetectedObject {
  type: string;
  confidence?: number;
  location?: string;
  details?: DetectedObjectDetails;
}

export interface LayoutAnalysis {
  document_structure?: string;
  sections?: string[];
  has_header?: boolean;
  has_footer?: boolean;
  page_orientation?: string;
  complexity?: string;
}

export interface AuthenticityCheck {
  has_signature?: boolean;
  signature_type?: string;
  has_official_stamp?: boolean;
  professional_appearance?: boolean;
  confidence_score?: number;
  notes?: string;
}

export interface DocumentDetail extends Document {
  batch_id?: string;
  batch_status?: string;
  currency?: string;
  download_url?: string;
  error_message?: string | null;
  file_hash?: string;
  items?: DocumentItem[];
  language?: string | null;
  metadata?: DocumentMetadata;
  entities?: DocumentEntities;
  page_count?: number;
  processed_at?: string;
  summary?: string | DocumentSummaryObject;
  tags?: DocumentTag[];
  total_amount?: string | number;
  word_count?: number;
  extracted_text?: string;
  visual_features?: DocumentVisualFeatures;
  detected_objects?: DetectedObject[];
  layout_analysis?: LayoutAnalysis;
  authenticity_check?: AuthenticityCheck;
}