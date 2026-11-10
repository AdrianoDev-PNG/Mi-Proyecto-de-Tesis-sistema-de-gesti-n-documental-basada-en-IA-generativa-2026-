// document.service.ts
import api from "@/app/lib/axios";
import { 
  DocumentsResponse,
  UploadResponse, 
  DocumentDetailResponse,
  BulkDownloadRequest,
  DeleteSingleDocumentResponse,
  DeleteDocumentsRequest,
  DeleteDocumentsResponse
} from "../types/types";

export const documentService = {
  async list(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<DocumentsResponse> {
    const response = await api.get(
      `/api/documents/list/?user_id=${userId}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async getDetail(documentId: string): Promise<DocumentDetailResponse> {
    const response = await api.get(`/api/documents/${documentId}/`);
    return response.data;
  },

  async upload(files: FileList, userId: string): Promise<UploadResponse> {
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }
    formData.append("user_id", userId);
    const response = await api.post("/api/documents/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  async downloadSingle(
    documentId: string, 
    filename: string
  ): Promise<void> {
    const response = await api.get(
      `/api/documents/${documentId}/download/`,
      {
        responseType: 'blob'
      }
    );
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async bulkDownload(
    request: BulkDownloadRequest
  ): Promise<Blob> {
    const response = await api.post(
      "/api/documents/download/bulk/",
      request,
      {
        headers: { 
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  async downloadAndSave(
    documentIds: string[],
    format: 'zip' | 'rar',
    archiveName: string
  ): Promise<void> {
    const blob = await this.bulkDownload({
      document_ids: documentIds,
      format: format,
      archive_name: archiveName
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${archiveName}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async downloadSearchResults(
    documentIds: string[],
    format: 'zip' | 'rar' = 'zip'
  ): Promise<void> {
    const archiveName = `busqueda_${new Date().getTime()}`;
    return this.downloadAndSave(documentIds, format, archiveName);
  },

  async deleteSingle(
    documentId: string,
    userId: string,
    deleteStorage: boolean = true
  ): Promise<DeleteSingleDocumentResponse> {
    const response = await api.delete(
      `/api/documents/${documentId}/delete/?user_id=${userId}&delete_storage=${deleteStorage}`
    );
    return response.data;
  },

  async deleteMultiple(
    request: DeleteDocumentsRequest
  ): Promise<DeleteDocumentsResponse> {
    const response = await api.delete(
      "/api/documents/delete/",
      {
        headers: { 
          'Content-Type': 'application/json'
        },
        data: request
      }
    );
    return response.data;
  },

  async deleteWithConfirmation(
    documentIds: string[],
    userId: string,
    deleteStorage: boolean = true
  ): Promise<DeleteDocumentsResponse> {
    if (!documentIds || documentIds.length === 0) {
      throw new Error('No hay documentos seleccionados para eliminar');
    }
    if (documentIds.length > 100) {
      throw new Error('Máximo 100 documentos por operación');
    }
    return this.deleteMultiple({
      document_ids: documentIds,
      user_id: userId,
      delete_storage: deleteStorage
    });
  }
};