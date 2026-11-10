// user/historia/[id]/page.tsx

"use client";

import { useState, useEffect, useCallback  } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";
import { searchService } from "../../services/search.service";
import { getAccessToken } from "@/app/services/auth.service";
import { userService } from "../../services/user.service";
import { SearchHistoryItem, DocumentDetail as DocumentDetailType } from "../../types/types";
import DocumentDetail from "../../Docs/components/DocumentDetail";
import { Eye } from "lucide-react";

export default function SearchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState<SearchHistoryItem | null>(null);
  const [documents, setDocuments] = useState<DocumentDetailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

const loadDetail = useCallback(async () => {
  try {
    const token = getAccessToken();
    if (!token) return;

    const userData = await userService.getMe();
    const response = await searchService.getSearchDetail(
      id as string,
      userData.user.id,
      token
    );

    setSearch(response.search);
    setDocuments(response.documents);
  } catch (error) {
    console.error("Error cargando detalle:", error);
  } finally {
    setLoading(false);
  }
}, [id]);

useEffect(() => {
  loadDetail();
}, [loadDetail]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className={`animate-spin rounded-full h-16 w-16 border-t-4 ${
            theme === "dark" ? "border-indigo-500" : "border-blue-600"
          }`}
        ></div>
      </div>
    );
  }

  if (!search) {
    return (
      <div className="text-center py-12">
        <p className={theme === "dark" ? "text-white" : "text-gray-900"}>
          Búsqueda no encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className={`px-4 py-2 rounded-lg ${
          theme === "dark"
            ? "bg-slate-700 hover:bg-slate-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        }`}
      >
        ← Volver
      </button>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark"
            ? "bg-slate-800/80 border border-slate-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <h1
          className={`text-2xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {`"${search.search_query}"`}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Documentos
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {search.found_document_count}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Tiempo
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {search.result_details.execution_time_seconds}s
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Tipo
            </p>
            <p
              className={`text-lg font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {search.result_details.search_type}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Fecha
            </p>
            <p
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {new Date(search.executed_at).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>

        <div>
          <h2
            className={`text-xl font-bold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Documentos Encontrados
          </h2>

          <div className="grid gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-6 rounded-lg flex items-start justify-between ${
                  theme === "dark"
                    ? "bg-slate-800/80 border border-slate-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {doc.filename}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {doc.metadata?.document_type && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          theme === "dark"
                            ? "bg-blue-900/50 text-blue-300"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {doc.metadata.document_type}
                      </span>
                    )}

                    {doc.metadata?.total_amount && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          theme === "dark"
                            ? "bg-green-900/50 text-green-300"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {doc.metadata.currency} {doc.metadata.total_amount}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={`p-2 rounded-lg transition-colors ml-4 flex-shrink-0 ${
                    theme === "dark"
                      ? "hover:bg-white/10 text-emerald-400 hover:text-emerald-300"
                      : "hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700"
                  }`}
                  title="Ver detalles del documento"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDocumentId && (
        <DocumentDetail
          documentId={selectedDocumentId}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
    </div>
  );
}
