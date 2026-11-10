"use client";

import { useState, useCallback, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Document, Pagination } from "../types/types";
import { documentService } from "../services/documents.service";
import { userService } from "../services/user.service";
import UploadSection from "../Docs/components/UploadSection";
import DocumentsList from "../Docs/components/DocumentsList";
import DocumentDetail from "./components/DocumentDetail";

export default function DocsPage() {
  const { theme } = useTheme();

  const [userId, setUserId] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    current_page: 1,
    total_pages: 0,
    has_next: false,
    has_previous: false,
    next_offset: null,
    previous_offset: null
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ya no necesita recibir token, los interceptors lo manejan
  const loadDocuments = useCallback(async (uid: string, page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await documentService.list(uid, page, 20);
      
      if (response.success) {
        setDocuments(response.documents || []);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUserAndDocs = async () => {
      try {
        const data = await userService.getMe();
        setUserId(data.user.id);
        loadDocuments(data.user.id, 1);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchUserAndDocs();
  }, [loadDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await documentService.upload(files, userId);
      setUploadProgress(100);
      setTimeout(() => {
        loadDocuments(userId, 1);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      setIsUploading(false);
      // Podrías mostrar un toast aquí también si quieres
    }
  };

  const handleDeleteDocuments = async (documentIds: string[], deleteStorage: boolean) => {
    if (!userId) return;

    try {
      const response = await documentService.deleteWithConfirmation(
        documentIds,
        userId,
        deleteStorage
      );
      
      if (response.success) {
        // Solo recargar documentos, el toast lo maneja DocumentsList
        await loadDocuments(userId, pagination.current_page);
      }
    } catch (error: unknown) {
      console.error("Error eliminando documentos:", error);
      
      // Lanzar el error para que DocumentsList lo capture y muestre en el toast
      const err = error as { response?: { data?: { error?: string } } };
      throw new Error(err.response?.data?.error || "Error al eliminar documentos");
    }
  };

  const handlePageChange = (page: number) => {
    if (userId && !isLoading) {
      loadDocuments(userId, page);
    }
  };

  const handleRefreshDocuments = async () => {
    if (userId && !isRefreshing) {
      setIsRefreshing(true);
      await loadDocuments(userId, pagination.current_page);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1
          className={`text-3xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Mis Documentos
        </h1>
      </div>

      <UploadSection
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onFileChange={handleFileUpload}
      />

      <DocumentsList
        documents={documents}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onViewDetails={(docId) => {
          setSelectedDocumentId(docId);
          setShowDocumentDetail(true);
        }}
        onDeleteDocuments={handleDeleteDocuments}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        onRefresh={handleRefreshDocuments}
        isRefreshing={isRefreshing}
      />

      {showDocumentDetail && selectedDocumentId && (
        <DocumentDetail 
          onClose={() => {
            setShowDocumentDetail(false);
            setSelectedDocumentId(undefined);
          }} 
          documentId={selectedDocumentId}
        />
      )}
    </div>
  );
}