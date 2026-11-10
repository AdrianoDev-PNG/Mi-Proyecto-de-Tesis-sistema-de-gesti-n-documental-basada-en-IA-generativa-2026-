// src/app/user/services/dashboard.service.ts
import api from "@/app/lib/axios";

export interface DashboardStats {
  success: boolean;
  timestamp: string;
  period_days: number;

  overview: {
    total_documents: number;
    pending: number;
    completed: number;
    processing: number;
    failed: number;
    success_rate: number;
    total_storage: string;
    total_storage_bytes: number;
    total_items_cataloged: number;
  };

  documents_timeline: Array<{
    date: string;
    count: number;
    completed: number;
    failed: number;
  }>;

  document_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;

  top_tags: Array<{
    tag: string;
    category: string;
    count: number;
    avg_confidence: number;
  }>;

  financial_summary: Array<{
    currency: string;
    total_amount: number;
    document_count: number;
    average: number;
  }>;

  recent_activity: Array<{
    id: string;
    filename: string;
    type: string;
    state: string;
    uploaded: string;
    processed?: string;
    processing_time?: string;
  }>;

  top_entities: {
    organizaciones: Array<{ name: string; count: number }>;
    personas: Array<{ name: string; count: number }>;
    lugares: Array<{ name: string; count: number }>;
  };

  processing_stats: {
    total_batches: number;
    completed_batches: number;
    failed_batches: number;
    processing_batches: number;
    avg_processing_time_seconds: number;
    avg_processing_time_formatted: string;
  };

  top_items: Array<{
    name: string;
    count: number;
    total_value: number;
    currency: string;
  }>;
}

class DashboardService {
  async getStats(days: number = 30): Promise<DashboardStats> {
    const response = await api.get(`/api/documents/stats/?days=${days}`);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
