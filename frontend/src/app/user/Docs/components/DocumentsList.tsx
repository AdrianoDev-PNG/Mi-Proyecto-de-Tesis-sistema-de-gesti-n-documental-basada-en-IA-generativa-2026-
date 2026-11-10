"use client";

import { useState } from "react";
import {
  FileText,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,  
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { Document, Pagination } from "../../types/types";
import DocumentsActions from "./DocumentsActions";

interface DocumentsListProps {
  documents: Document[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onViewDetails: (documentId: string) => void;
  onDeleteDocuments: (documentIds: string[], deleteStorage: boolean) => Promise<void>;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function DocumentsList({
  documents,
  filterStatus,
  setFilterStatus,
  onViewDetails,
  onDeleteDocuments,
  pagination,
  onPageChange,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}: DocumentsListProps) {
  const { theme } = useTheme();
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const toggleSelectDocument = (docId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocuments(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.size === filteredDocs.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocs.map(doc => doc.id)));
    }
  };

  const getStatusColor = (status: string) => {
    const isDark = theme === "dark";
    switch (status.toLowerCase()) {
      case "completed":
        return isDark
          ? "bg-emerald-500/30 text-emerald-200 border-emerald-500/50"
          : "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "processing":
        return isDark
          ? "bg-blue-500/30 text-blue-200 border-blue-500/50"
          : "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return isDark
          ? "bg-amber-500/30 text-amber-200 border-amber-500/50"
          : "bg-amber-100 text-amber-700 border-amber-200";
      case "failed":
        return isDark
          ? "bg-red-500/30 text-red-200 border-red-500/50"
          : "bg-red-100 text-red-700 border-red-200";
      default:
        return isDark
          ? "bg-slate-500/30 text-slate-200 border-slate-500/50"
          : "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4 animate-spin" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      completed: "Completado",
      processing: "Procesando",
      pending: "Pendiente",
      failed: "Fallido",
    };
    return labels[status.toLowerCase()] || status;
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter =
      filterStatus === "all" ||
      doc.state.toLowerCase() === filterStatus.toLowerCase();
    return matchesFilter;
  });

  const renderPaginationButtons = () => {
    const buttons = [];
    const currentPage = pagination.current_page;
    const totalPages = pagination.total_pages;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(5, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - 4);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            i === currentPage
              ? theme === "dark"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                : "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
              : theme === "dark"
              ? "bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
          }`}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div
      className={`backdrop-blur-lg border rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-white/5 border-white/10"
          : "bg-white border-blue-200/30"
      }`}
    >
      <DocumentsActions
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        selectedDocuments={selectedDocuments}
        setSelectedDocuments={setSelectedDocuments}
        onDeleteDocuments={onDeleteDocuments}
        filteredDocs={filteredDocs}
        toggleSelectAll={toggleSelectAll}
        pagination={pagination}
      />

      <div
        className={`overflow-y-auto transition-colors duration-300 ${
          theme === "dark" ? "divide-white/10" : "divide-blue-200/30"
        }`}
        style={{ 
          height: "calc(100vh - 450px)",
          minHeight: "400px",
          maxHeight: "600px"
        }}
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-t-4 mx-auto mb-4 ${
                theme === "dark" ? "border-indigo-500" : "border-blue-600"
              }`}
            ></div>
            <p
              className={`text-lg transition-colors duration-300 ${
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Cargando documentos...
            </p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen
              className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
                theme === "dark" ? "text-slate-600" : "text-slate-300"
              }`}
            />
            <p
              className={`text-lg transition-colors duration-300 ${
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              No hay documentos para mostrar
            </p>
            <p className="text-sm mt-1 text-slate-500">
              {filterStatus !== "all"
                ? "Intenta con otros filtros"
                : "Sube archivos para comenzar"}
            </p>
          </div>
        ) : (
          <div
            className={`divide-y ${
              theme === "dark" ? "divide-white/10" : "divide-blue-200/30"
            }`}
          >
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 transition-colors duration-300 ${
                  selectedDocuments.has(doc.id)
                    ? theme === "dark"
                      ? "bg-indigo-500/10"
                      : "bg-blue-50"
                    : theme === "dark"
                    ? "hover:bg-white/5"
                    : "hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => toggleSelectDocument(doc.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
                        selectedDocuments.has(doc.id)
                          ? "bg-blue-600 border-blue-600"
                          : theme === "dark"
                          ? "border-slate-600 hover:border-slate-500"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {selectedDocuments.has(doc.id) && (
                        <CheckSquare className="w-5 h-5 text-white" />
                      )}
                    </button>

                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        theme === "dark" ? "bg-indigo-500/20" : "bg-blue-100"
                      }`}
                    >
                      <FileText
                        className={`w-6 h-6 ${
                          theme === "dark" ? "text-indigo-400" : "text-blue-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold truncate transition-colors duration-300 ${
                          theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {doc.filename}
                      </h3>
                      <p
                        className={`text-sm transition-colors duration-300 ${
                          theme === "dark" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {new Date(doc.upload_date).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${getStatusColor(
                        doc.state
                      )}`}
                    >
                      {getStatusIcon(doc.state)}
                      <span>{getStatusLabel(doc.state)}</span>
                    </div>

                    <button
                      onClick={() => onViewDetails(doc.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === "dark"
                          ? "hover:bg-white/10 text-emerald-400 hover:text-emerald-300"
                          : "hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700"
                      }`}
                      title="Ver detalles del documento"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {doc.file_path && (
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = doc.file_path || "";
                          link.download = doc.filename;
                          link.click();
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === "dark"
                            ? "hover:bg-white/10 text-slate-400 hover:text-blue-400"
                            : "hover:bg-blue-100 text-slate-600 hover:text-blue-600"
                        }`}
                        title="Descargar documento"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`p-4 border-t transition-colors duration-300 ${
          theme === "dark"
            ? "border-white/10 bg-gradient-to-r from-white/5 to-transparent"
            : "border-blue-200/30 bg-gradient-to-r from-blue-50/50 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div
            className={`text-sm transition-colors duration-300 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Página{" "}
            <span
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              {pagination.current_page}
            </span>{" "}
            de{" "}
            <span
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              {pagination.total_pages}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={!pagination.has_previous || isLoading}
              className={`p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:bg-slate-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50"
              }`}
              title="Página anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {pagination.total_pages > 1 && (
              <div className="hidden sm:flex items-center gap-2">
                {renderPaginationButtons()}
              </div>
            )}

            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={!pagination.has_next || isLoading}
              className={`p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:bg-slate-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50"
              }`}
              title="Página siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}