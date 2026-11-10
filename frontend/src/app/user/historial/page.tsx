// user/historia/page.tsx

"use client";

import { useState, useEffect, useCallback  } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import { searchService } from "../services/search.service";
import { getAccessToken } from "@/app/services/auth.service";
import { userService } from "../services/user.service";
import { SearchHistoryItem, PopularSearch } from "../types/types";
import SearchHistoryCard from "./components/SearchHistoryCard";
import PopularSearches from "./components/PopularSearches";
import ConfirmationModal from "../../components/ConfirmationModal";
import { Trash2 } from "lucide-react";

export default function HistoriaPage() {
  const { theme } = useTheme();
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);    
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 10;



const loadData = useCallback(async () => {
  try {
    setLoading(true);
    const token = getAccessToken();
    if (!token) return;

    const userData = await userService.getMe();
    setUserId(userData.user.id);

    const offset = (currentPage - 1) * limit;

    const historyResponse = await searchService.getSearchHistory(
      userData.user.id,
      token,
      limit,
      offset
    );

    setSearches(historyResponse.searches);
    setTotalPages(historyResponse.pagination.total_pages);

    const popularResponse = await searchService.getPopularSearches(
      userData.user.id,
      token,
      5
    );

    setPopularSearches(popularResponse.popular_searches);
  } catch (error) {
    console.error("Error cargando historial:", error);
  } finally {
    setLoading(false);
  }
}, [currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (searchId: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      await searchService.deleteSearch(searchId, userId, token);
      setSearches(searches.filter(s => s.id !== searchId));
    } catch (error) {
      console.error("Error eliminando búsqueda:", error);
    }
  };

  const handleClearAll = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmClearAll = async () => {
    try {
      setIsDeleting(true);
      const token = getAccessToken();
      if (!token) return;

      await searchService.clearHistory(userId, token);
      setSearches([]);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error limpiando historial:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`animate-spin rounded-full h-16 w-16 border-t-4 ${
          theme === "dark" ? "border-indigo-500" : "border-blue-600"
        }`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Historial de Búsquedas
          </h1>
          <p className={`mt-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {searches.length} búsquedas registradas
          </p>
        </div>

        {searches.length > 0 && (
          <button
            onClick={handleClearAll}
            className={`px-4 py-2 rounded-lg transition-all ${
              theme === "dark"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {popularSearches.length > 0 && (
        <PopularSearches searches={popularSearches} theme={theme} />
      )}

      {searches.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${
          theme === "dark" ? "bg-slate-800/50" : "bg-white/50"
        }`}>
          <p className={`text-lg ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            No hay búsquedas en el historial
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {searches.map((search) => (
              <SearchHistoryCard
                key={search.id}
                search={search}
                theme={theme}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                ← Anterior
              </button>
              <span className={`px-4 py-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Eliminar Historial"
        subtitle="Esta acción no se puede deshacer"
        message="¿Estás seguro de eliminar todo el historial de búsquedas?"
        itemCount={searches.length}
        itemLabel="búsqueda"
        isLoading={isDeleting}
        confirmButtonText="Limpiar Historial"
        confirmButtonVariant="danger"
        icon={Trash2}
        showAdditionalCheckbox={false}
        itemsList={[
          "Todas las búsquedas registradas",
          "El historial de búsquedas",
          "Los estadísticos asociados"
        ]}
      />
    </div>
  );
}