"use client";

import { Eye, Download, DownloadCloud, FileArchive } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { IntelligentSearchResponse } from "../../types/types";
import { useState } from "react";

interface SearchResultsProps {
  searchResults: IntelligentSearchResponse;
  onViewDetails: (documentId: string) => void;
  onDownloadSingle: (documentId: string, filename: string) => Promise<void>;
  onDownloadSelected: (documentIds: string[], format: 'zip' | 'rar') => Promise<void>;
  token: string;
}

export default function SearchResults({ 
  searchResults, 
  onViewDetails,
  onDownloadSingle,
  onDownloadSelected,
}: SearchResultsProps) {
  const { theme } = useTheme();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<Set<string>>(new Set());
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'zip' | 'rar'>('zip');
  const [showFormatSelector, setShowFormatSelector] = useState(false);

  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === searchResults.results.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(searchResults.results.map((r) => r.document.id)));
    }
  };

  const handleDownloadSingle = async (docId: string, filename: string) => {
    setIsDownloading(new Set([...isDownloading, docId]));
    try {
      await onDownloadSingle(docId, filename);
    } finally {
      setIsDownloading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedDocs.size === 0) return;
    
    setIsDownloadingBulk(true);
    try {
      await onDownloadSelected(Array.from(selectedDocs), selectedFormat);
      setSelectedDocs(new Set());
      setShowFormatSelector(false);
    } finally {
      setIsDownloadingBulk(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-2xl shadow-lg ${
          theme === "dark"
            ? "bg-slate-800 border border-slate-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <div className="p-6 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3
              className={`text-lg font-bold flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Resultados de Búsqueda
            </h3>
            
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  theme === "dark"
                    ? "bg-green-900/40 text-green-300"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {searchResults.count} documento{searchResults.count !== 1 ? "s" : ""}{" "}
                encontrado{searchResults.count !== 1 ? "s" : ""}
              </span>

              {selectedDocs.size > 0 && (
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
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        theme === "dark"
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Descargar ({selectedDocs.size})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {searchResults.count > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  selectedDocs.size === searchResults.results.length &&
                  searchResults.results.length > 0
                }
                onChange={toggleSelectAll}
                className={`w-5 h-5 rounded cursor-pointer transition-colors ${
                  theme === "dark"
                    ? "bg-white/10 border-white/20 checked:bg-indigo-600 checked:border-indigo-600"
                    : "bg-white border-gray-300 checked:bg-blue-600 checked:border-blue-600"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Seleccionar todos los documentos
              </span>
            </div>
          )}
        </div>

        <div className="max-h-[600px] overflow-y-auto p-6">
          {searchResults.count === 0 ? (
            <div className="text-center py-12">
              <svg
                className={`w-16 h-16 mx-auto mb-4 ${
                  theme === "dark" ? "text-slate-600" : "text-gray-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p
                className={`text-lg font-medium ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No se encontraron documentos que coincidan con tu búsqueda
              </p>
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Intenta modificar los criterios de búsqueda o usar términos diferentes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.results.map((result) => (
                <div
                  key={result.document.id}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    theme === "dark"
                      ? "bg-slate-700/30 border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 hover:shadow-xl hover:shadow-indigo-500/10"
                      : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:border-blue-500 hover:shadow-xl"
                  } ${
                    selectedDocs.has(result.document.id)
                      ? theme === "dark"
                        ? "border-indigo-500 bg-slate-700/50"
                        : "border-blue-500 bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(result.document.id)}
                        onChange={() => toggleDocSelection(result.document.id)}
                        className={`w-5 h-5 mt-1 rounded cursor-pointer transition-colors flex-shrink-0 ${
                          theme === "dark"
                            ? "bg-white/10 border-white/20 checked:bg-indigo-600 checked:border-indigo-600"
                            : "bg-white border-gray-300 checked:bg-blue-600 checked:border-blue-600"
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <svg
                            className={`w-5 h-5 flex-shrink-0 ${
                              theme === "dark" ? "text-indigo-400" : "text-blue-600"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h4
                            className={`font-bold text-lg ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {result.document.filename}
                          </h4>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {result.matches.slice(0, 5).map((match, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                theme === "dark"
                                  ? "bg-green-900/40 text-green-300 border border-green-700"
                                  : "bg-green-100 text-green-800 border border-green-300"
                              }`}
                            >
                              {match}
                            </span>
                          ))}
                          {result.match_count > 5 && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                theme === "dark"
                                  ? "bg-slate-600 text-slate-300"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              +{result.match_count - 5} más
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span
                            className={`flex items-center gap-1 ${
                              theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            {result.match_count} coincidencia
                            {result.match_count !== 1 ? "s" : ""}
                          </span>
                          <span
                            className={`font-mono text-xs ${
                              theme === "dark" ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            ID: {result.document.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div
                        className={`px-4 py-2 rounded-full font-bold text-sm ${
                          result.score >= 80
                            ? theme === "dark"
                              ? "bg-green-900/40 text-green-300 border border-green-700"
                              : "bg-green-100 text-green-800 border-2 border-green-300"
                            : result.score >= 50
                            ? theme === "dark"
                              ? "bg-yellow-900/40 text-yellow-300 border border-yellow-700"
                              : "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                            : theme === "dark"
                            ? "bg-orange-900/40 text-orange-300 border border-orange-700"
                            : "bg-orange-100 text-orange-800 border-2 border-orange-300"
                        }`}
                      >
                        Score: {result.score}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetails(result.document.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark"
                              ? "hover:bg-white/10 text-emerald-400 hover:text-emerald-300"
                              : "hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700"
                          }`}
                          title="Ver detalles del documento"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {result.document.file_path && (
                          <button
                            onClick={() =>
                              handleDownloadSingle(
                                result.document.id,
                                result.document.filename
                              )
                            }
                            disabled={isDownloading.has(result.document.id)}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              theme === "dark"
                                ? "hover:bg-white/10 text-blue-400 hover:text-blue-300"
                                : "hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                            }`}
                            title="Descargar documento"
                          >
                            <Download
                              className={`w-4 h-4 ${
                                isDownloading.has(result.document.id)
                                  ? "animate-bounce"
                                  : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}