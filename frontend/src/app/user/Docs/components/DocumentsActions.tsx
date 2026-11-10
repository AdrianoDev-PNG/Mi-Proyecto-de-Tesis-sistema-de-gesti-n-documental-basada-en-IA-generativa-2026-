"use client";

import { useState } from "react";
import {
  Filter,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  DownloadCloud,
  FileArchive,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { Document, Pagination } from "../../types/types";
import { documentService } from "../../services/documents.service";
import ConfirmationModal from "../../../components/ConfirmationModal";
import Toast from "../../../context/Toast";
import { useToast } from "../../../hook/useToast";

interface DocumentsActionsProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedDocuments: Set<string>;
  setSelectedDocuments: (selection: Set<string>) => void;
  onDeleteDocuments: (documentIds: string[], deleteStorage: boolean) => Promise<void>;
  filteredDocs: Document[];
  toggleSelectAll: () => void;
  pagination: Pagination;
}

export default function DocumentsActions({
  filterStatus,
  setFilterStatus,
  onRefresh,
  isRefreshing,
  selectedDocuments,
  setSelectedDocuments,
  onDeleteDocuments,
  filteredDocs,
  toggleSelectAll,
  pagination,
}: DocumentsActionsProps) {
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'zip' | 'rar'>('zip');
  const [showFormatSelector, setShowFormatSelector] = useState(false);

  const handleDeleteClick = () => {
    if (selectedDocuments.size > 0) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    const docCount = selectedDocuments.size;
    try {
      setIsDeleting(true);
      setShowDeleteModal(false);
      
      await onDeleteDocuments(Array.from(selectedDocuments), true);
      
      setSelectedDocuments(new Set());
      
      setTimeout(() => {
        showToast(
          "success",
          `${docCount} documento${docCount > 1 ? 's' : ''} eliminado${docCount > 1 ? 's' : ''} exitosamente`
        );
      }, 100);
      
    } catch (error) {
      console.error("Error eliminando documentos:", error);
      
      showToast(
        "error",
        error instanceof Error ? error.message : "Error al eliminar documentos"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedDocuments.size === 0) return;
    
    setIsDownloadingBulk(true);
    try {
      const archiveName = `documentos_${new Date().getTime()}`;
      await documentService.downloadAndSave(Array.from(selectedDocuments), selectedFormat, archiveName);
      
      setSelectedDocuments(new Set());
      setShowFormatSelector(false);
      
      showToast(
        "success",
        `${selectedDocuments.size} documento${selectedDocuments.size > 1 ? 's' : ''} descargado${selectedDocuments.size > 1 ? 's' : ''} exitosamente`
      );
    } catch (error) {
      console.error("Error descargando documentos:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Error al descargar documentos"
      );
    } finally {
      setIsDownloadingBulk(false);
    }
  };

  return (
    <>
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}

      <div
        className={`p-6 border-b transition-colors duration-300 ${
          theme === "dark"
            ? "border-white/10 bg-gradient-to-r from-white/5 to-transparent"
            : "border-blue-200/30 bg-gradient-to-r from-blue-50/50 to-transparent"
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Filter
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-300 ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full pl-10 pr-8 py-3 border rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20 [&>option]:bg-slate-800 [&>option]:text-white"
                  : "bg-white border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 [&>option]:bg-white [&>option]:text-slate-900"
              }`}
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completados</option>
              <option value="processing">Procesando</option>
              <option value="pending">Pendientes</option>
              <option value="failed">Fallidos</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              theme === "dark"
                ? "bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          {selectedDocuments.size > 0 && (
            <>
              <div className="relative">
                {showFormatSelector ? (
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                    theme === "dark"
                      ? "bg-slate-700 border-slate-600"
                      : "bg-white border-gray-300"
                  }`}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFormat('zip')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          selectedFormat === 'zip'
                            ? theme === "dark"
                              ? "bg-indigo-600 text-white"
                              : "bg-blue-600 text-white"
                            : theme === "dark"
                            ? "bg-slate-600 text-slate-300 hover:bg-slate-500"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        <FileArchive className="w-4 h-4 inline mr-1" />
                        ZIP
                      </button>
                      <button
                        onClick={() => setSelectedFormat('rar')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          selectedFormat === 'rar'
                            ? theme === "dark"
                              ? "bg-indigo-600 text-white"
                              : "bg-blue-600 text-white"
                            : theme === "dark"
                            ? "bg-slate-600 text-slate-300 hover:bg-slate-500"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        <FileArchive className="w-4 h-4 inline mr-1" />
                        RAR
                      </button>
                    </div>
                    
                    <div className={`w-px h-6 ${
                      theme === "dark" ? "bg-slate-600" : "bg-gray-300"
                    }`}></div>
                    
                    <button
                      onClick={handleDownloadSelected}
                      disabled={isDownloadingBulk}
                      className={`px-4 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 ${
                        theme === "dark"
                          ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-600"
                          : "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300"
                      } disabled:cursor-not-allowed`}
                    >
                      {isDownloadingBulk ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Descargando...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-4 h-4" />
                          <span>Descargar</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowFormatSelector(false)}
                      className={`px-2 py-1.5 rounded-md ${
                        theme === "dark"
                          ? "hover:bg-slate-600 text-slate-400"
                          : "hover:bg-gray-200 text-gray-600"
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFormatSelector(true)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      theme === "dark"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Descargar ({selectedDocuments.size})</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar ({selectedDocuments.size})</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div
            className={`text-sm transition-colors duration-300 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Mostrando{" "}
            <span
              className={`font-semibold transition-colors duration-300 ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              {filteredDocs.length}
            </span>{" "}
            de{" "}
            <span
              className={`font-semibold transition-colors duration-300 ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              {pagination.total}
            </span>{" "}
            documentos
          </div>

          {filteredDocs.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-white/5 text-slate-300"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {selectedDocuments.size === filteredDocs.length ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Deseleccionar todos
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Seleccionar todos
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Documentos"
        subtitle="Esta acción no se puede deshacer"
        message="Estás a punto de eliminar"
        itemCount={selectedDocuments.size}
        itemLabel="documento"
        isLoading={isDeleting}
        confirmButtonText="Eliminar"
        confirmButtonVariant="danger"
        icon={Trash2}
        showAdditionalCheckbox={false}
        itemsList={[
          "Los archivos PDF/DOCX originales del servidor",
          "Todos los metadatos asociados",
          "Las referencias en batches de procesamiento"
        ]}
      />
    </>
  );
}