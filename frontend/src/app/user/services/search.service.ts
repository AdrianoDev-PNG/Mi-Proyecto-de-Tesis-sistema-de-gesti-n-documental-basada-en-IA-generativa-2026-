// services/search.service.ts

import apiUser from "@/app/lib/axios";
import { 
  IntelligentSearchResponse, 
  ItemSearchResponse,
  ExportTableRow,
  ExportColumn,
  SearchHistoryResponse,
  SearchHistoryDetailResponse,
  PopularSearchesResponse,
  DeleteSearchResponse,
  ClearHistoryResponse
} from "../types/types";

export const searchService = {
  async intelligentSearch(query: string, userId: string, token: string): Promise<IntelligentSearchResponse> {
    const response = await apiUser.post(
      "/api/documents/search/intelligent/",
      { query, user_id: userId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async searchItems(
    filters: {
      name?: string;
      min_price?: number;
      max_price?: number;
      item_type?: string;
      limit?: number;
    },
    token: string
  ): Promise<ItemSearchResponse> {
    const params = new URLSearchParams();
    
    if (filters.name) params.append("name", filters.name);
    if (filters.min_price !== undefined) params.append("min_price", filters.min_price.toString());
    if (filters.max_price !== undefined) params.append("max_price", filters.max_price.toString());
    if (filters.item_type) params.append("item_type", filters.item_type);
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiUser.get(`/api/documents/search/items/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async exportSearchResults(
    tableData: ExportTableRow[],
    columns: ExportColumn[],
    query: string,
    token: string
  ): Promise<Blob> {
    const response = await apiUser.post(
      "/api/documents/export/search-results/",
      {
        table_data: tableData,
        columns: columns,
        query: query
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  async getSearchHistory(
    userId: string,
    token: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SearchHistoryResponse> {
    const params = new URLSearchParams({
      user_id: userId,
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiUser.get(`/api/documents/search/history/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getSearchDetail(
    searchId: string,
    userId: string,
    token: string
  ): Promise<SearchHistoryDetailResponse> {
    const params = new URLSearchParams({ user_id: userId });

    const response = await apiUser.get(`/api/documents/search/history/${searchId}/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async deleteSearch(
    searchId: string,
    userId: string,
    token: string
  ): Promise<DeleteSearchResponse> {
    const response = await apiUser.delete(`/api/documents/search/history/${searchId}/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { user_id: userId }
    });
    return response.data;
  },

  async clearHistory(userId: string, token: string): Promise<ClearHistoryResponse> {
    const response = await apiUser.delete("/api/documents/search/history/", {
      headers: { Authorization: `Bearer ${token}` },
      data: { user_id: userId }
    });
    return response.data;
  },

  async getPopularSearches(
    userId: string,
    token: string,
    limit: number = 10
  ): Promise<PopularSearchesResponse> {
    const params = new URLSearchParams({
      user_id: userId,
      limit: limit.toString()
    });

    const response = await apiUser.get(`/api/documents/search/popular/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};