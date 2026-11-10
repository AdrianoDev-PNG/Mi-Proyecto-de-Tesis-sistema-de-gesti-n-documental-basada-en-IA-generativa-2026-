// user/historia/components/SearchHistoryCard.tsx

import { useState } from "react";
import { SearchHistoryItem } from "../../types/types";
import { useRouter } from "next/navigation";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { Trash2 } from "lucide-react";

interface Props {
  search: SearchHistoryItem;
  theme: "light" | "dark";
  onDelete: (id: string) => void;
}

export default function SearchHistoryCard({ search, theme, onDelete }: Props) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      onDelete(search.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error eliminando búsqueda:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`p-6 rounded-lg transition-all ${
        theme === "dark"
          ? "bg-slate-800/80 hover:bg-slate-800 border border-slate-700"
          : "bg-white hover:shadow-lg border border-gray-200"
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {`"${search.search_query}"`}
            </h3>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm ${
                theme === "dark"
                  ? "bg-indigo-900/50 text-indigo-300"
                  : "bg-indigo-100 text-indigo-700"
              }`}>
                {search.found_document_count} documentos
              </span>

              {search.result_details.execution_time_seconds && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  theme === "dark"
                    ? "bg-slate-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {search.result_details.execution_time_seconds}s
                </span>
              )}

              {search.search_filters.tipo_documento && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  theme === "dark"
                    ? "bg-blue-900/50 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {search.search_filters.tipo_documento}
                </span>
              )}
            </div>

            <p className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              {formatDate(search.executed_at)}
            </p>
          </div>

          <div className="flex gap-2 ml-4">
            <button
              onClick={() => router.push(`/user/historial/${search.id}`)}
              className={`px-4 py-2 rounded-lg transition-all ${
                theme === "dark"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Ver Detalles
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
                theme === "dark"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              }`}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Búsqueda"
        subtitle="Esta acción no se puede deshacer"
        message="¿Estás seguro de eliminar esta búsqueda?"
        itemCount={1}
        itemLabel="búsqueda"
        isLoading={isDeleting}
        confirmButtonText="Eliminar"
        confirmButtonVariant="danger"
        icon={Trash2}
        showAdditionalCheckbox={false}
        itemsList={[
          "El registro de la búsqueda",
          "El historial asociado",
          "Los estadísticos de esta búsqueda"
        ]}
      />
    </>
  );
}