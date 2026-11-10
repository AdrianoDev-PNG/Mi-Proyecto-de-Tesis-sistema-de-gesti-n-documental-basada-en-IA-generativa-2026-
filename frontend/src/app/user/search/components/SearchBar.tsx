"use client";

import { useTheme } from "../../../context/ThemeContext";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  onClear: () => void;
  hasResults: boolean;
}

const SEARCH_EXAMPLES = [
  "facturas de enero 2024",
  "documentos con laptops",
  "contratos entre 5000 y 10000 USD",
  "documentos de transporte de carga",
  "boletas con productos de más de 500 soles",
];

export default function SearchBar({
  query,
  setQuery,
  isSearching,
  onSearch,
  onClear,
  hasResults,
}: SearchBarProps) {
  const { theme } = useTheme();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching && query.trim()) {
      onSearch();
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 shadow-lg transition-all ${
        theme === "dark"
          ? "bg-slate-800 border border-slate-700"
          : "bg-white border border-gray-200"
      }`}
    >
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ejemplo: facturas de enero 2024 con productos de más de 1000 soles"
            className={`w-full px-6 py-4 pr-14 text-lg rounded-xl border-2 transition-all focus:ring-4 focus:outline-none ${
              theme === "dark"
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
            }`}
            disabled={isSearching}
          />
          <svg
            className={`absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 ${
              theme === "dark" ? "text-slate-400" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSearch}
            disabled={isSearching || !query.trim()}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              theme === "dark"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/50"
            }`}
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Analizando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </span>
            )}
          </button>

          {hasResults && (
            <button
              onClick={onClear}
              className={`px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-300 dark:border-slate-600">
        <p
          className={`text-sm font-semibold mb-2 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Ejemplos de búsqueda:
        </p>
        <div className="flex flex-wrap gap-2">
          {SEARCH_EXAMPLES.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(example)}
              disabled={isSearching}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all hover:scale-105 disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}