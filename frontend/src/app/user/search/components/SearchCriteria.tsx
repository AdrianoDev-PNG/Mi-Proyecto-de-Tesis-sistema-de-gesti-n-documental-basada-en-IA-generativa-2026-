"use client";

import { useTheme } from "../../../context/ThemeContext";
import { IntelligentSearchResponse } from "../../types/types";

interface SearchCriteriaProps {
  searchResults: IntelligentSearchResponse;
}

export default function SearchCriteria({ searchResults }: SearchCriteriaProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-2xl p-6 shadow-lg animate-fade-in ${
        theme === "dark"
          ? "bg-slate-800 border border-slate-700"
          : "bg-white border border-gray-200"
      }`}
    >
      <h3
        className={`text-lg font-bold mb-4 pb-2 border-b flex items-center gap-2 ${
          theme === "dark" 
            ? "text-white border-slate-700" 
            : "text-gray-900 border-gray-200"
        }`}
      >
        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
        Criterios de Búsqueda Detectados
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p
            className={`text-sm font-semibold mb-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Intención
          </p>
          <span
            className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
              theme === "dark"
                ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700"
                : "bg-indigo-100 text-indigo-800 border border-indigo-300"
            }`}
          >
            {searchResults.search_criteria.intent}
          </span>
        </div>

        <div>
          <p
            className={`text-sm font-semibold mb-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Tipo de búsqueda
          </p>
          <span
            className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
              theme === "dark"
                ? "bg-purple-900/40 text-purple-300 border border-purple-700"
                : "bg-purple-100 text-purple-800 border border-purple-300"
            }`}
          >
            {searchResults.search_criteria.search_type}
          </span>
        </div>

        {searchResults.search_criteria.filters.search_phrase && (
          <div className="md:col-span-2 lg:col-span-1">
            <p
              className={`text-sm font-semibold mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Frase clave
            </p>
            <p
              className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              &quot;{searchResults.search_criteria.filters.search_phrase}&quot;
            </p>
          </div>
        )}

        {searchResults.search_criteria.filters.date_range && (
          <div>
            <p
              className={`text-sm font-semibold mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Rango de fechas
            </p>
            <p
              className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {searchResults.search_criteria.filters.date_range}
            </p>
          </div>
        )}

        {(searchResults.search_criteria.filters.precio_min ||
          searchResults.search_criteria.filters.precio_max) && (
          <div>
            <p
              className={`text-sm font-semibold mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Rango de precio
            </p>
            <p
              className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {searchResults.search_criteria.filters.precio_min || 0} -{" "}
              {searchResults.search_criteria.filters.precio_max || "∞"}{" "}
              {searchResults.search_criteria.filters.moneda || "PEN"}
            </p>
          </div>
        )}

        {searchResults.search_criteria.filters.tipo_documento && (
          <div>
            <p
              className={`text-sm font-semibold mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Tipo de documento
            </p>
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                theme === "dark"
                  ? "bg-blue-900/40 text-blue-300 border border-blue-700"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              {searchResults.search_criteria.filters.tipo_documento}
            </span>
          </div>
        )}
      </div>

      <p
        className={`mt-4 pt-4 border-t text-sm italic ${
          theme === "dark" 
            ? "text-gray-400 border-slate-700" 
            : "text-gray-600 border-gray-200"
        }`}
      >
        {searchResults.search_criteria.description}
      </p>
    </div>
  );
}