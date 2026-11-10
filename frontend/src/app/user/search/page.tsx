// user/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { searchService } from "../services/search.service";
import { documentService } from "../services/documents.service";
import { IntelligentSearchResponse } from "../types/types";
import { getAccessToken, getUser } from "../../services/auth.service";
import SearchBar from "./components/SearchBar";
import SearchCriteria from "./components/SearchCriteria";
import SearchResults from "./components/SearchResults";
import EditableSearchTable from "./components/EditableSearchTable";
import DocumentDetail from "../Docs/components/DocumentDetail";

export default function SearchPage() {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<IntelligentSearchResponse | null>(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    const user = getUser();
    
    if (accessToken) {
      setToken(accessToken);
    }
    
    if (user && user.id) {
      setUserId(user.id);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    if (!token) {
      setError("No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    if (!userId) {
      setError("No se pudo obtener tu ID de usuario. Por favor, recarga la página.");
      return;
    }

    setIsSearching(true);
    setError("");
    setSearchResults(null);

    try {
      const data = await searchService.intelligentSearch(query, userId, token);
      setSearchResults(data);
      
      if (!data || !data.results || data.results.length === 0) {
        console.log("No se encontraron resultados");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la búsqueda");
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults(null);
    setError("");
  };

  const handleViewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const handleCloseDetail = () => {
    setSelectedDocumentId(null);
  };

  const handleDownloadSingle = async (documentId: string, filename: string) => {
    if (!token) {
      setError("No estás autenticado para descargar documentos.");
      return;
    }

    try {
      await documentService.downloadSingle(documentId, filename);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al descargar el documento"
      );
    }
  };

  const handleDownloadSelected = async (
    documentIds: string[], 
    format: 'zip' | 'rar' = 'zip'
  ) => {
    if (!token) {
      setError("No estás autenticado para descargar documentos.");
      return;
    }

    if (documentIds.length === 0) {
      setError("No hay documentos seleccionados para descargar.");
      return;
    }

    try {
      const archiveName = `busqueda_${new Date().getTime()}`;
      await documentService.downloadAndSave(documentIds, format, archiveName);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al descargar los documentos"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className={`text-3xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Búsqueda Inteligente
          </h1>
          <p
            className={`mt-2 text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Busca documentos usando lenguaje natural con IA
          </p>
        </div>
      </div>

      <SearchBar
        query={query}
        setQuery={setQuery}
        isSearching={isSearching}
        onSearch={handleSearch}
        onClear={handleClear}
        hasResults={!!searchResults}
      />

      {error && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 animate-fade-in ${
            theme === "dark"
              ? "bg-red-900/30 border border-red-800 text-red-200"
              : "bg-red-100 border border-red-300 text-red-800"
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {searchResults && <SearchCriteria searchResults={searchResults} />}

      {searchResults && (
        <SearchResults 
          searchResults={searchResults} 
          token={token}
          onViewDetails={handleViewDocument}
          onDownloadSingle={handleDownloadSingle}
          onDownloadSelected={handleDownloadSelected}
        />
      )}

      {searchResults && searchResults.count > 0 && (
        <EditableSearchTable searchResults={searchResults} />
      )}

      {selectedDocumentId && (
        <DocumentDetail
          onClose={handleCloseDetail}
          documentId={selectedDocumentId}
        />
      )}
    </div>
  );
}