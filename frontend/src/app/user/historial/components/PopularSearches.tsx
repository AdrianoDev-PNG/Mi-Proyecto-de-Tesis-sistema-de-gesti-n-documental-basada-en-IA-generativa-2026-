// user/historia/components/PopularSearches.tsx

import { PopularSearch } from "../../types/types";

interface Props {
  searches: PopularSearch[];
  theme: "light" | "dark";
}

export default function PopularSearches({ searches, theme }: Props) {
  return (
    <div className={`p-6 rounded-lg ${
      theme === "dark"
        ? "bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/50"
        : "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
    }`}>
      <h2 className={`text-xl font-bold mb-4 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}>
        Búsquedas Más Frecuentes
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {searches.map((search, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              theme === "dark"
                ? "bg-slate-800/60 border border-slate-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <p className={`font-medium mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {`"${search.query}"`}
            </p>
            <div className="flex gap-3 text-sm">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                {search.count}x
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                {search.total_docs_found} docs
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}