"use client";

import { useTheme } from "../../../context/ThemeContext";

interface TagsCloudProps {
  tags: Array<{
    tag: string;
    category: string;
    count: number;
    avg_confidence: number;
  }>;
}

export default function TagsCloud({ tags }: TagsCloudProps) {
  const { theme } = useTheme();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      document_type: "bg-blue-500/20 text-blue-600 border-blue-500/30",
      topic: "bg-green-500/20 text-green-600 border-green-500/30",
      industry: "bg-purple-500/20 text-purple-600 border-purple-500/30",
      currency: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
      payment_terms: "bg-orange-500/20 text-orange-600 border-orange-500/30",
      urgency: "bg-red-500/20 text-red-600 border-red-500/30",
      location: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30",
      brand: "bg-pink-500/20 text-pink-600 border-pink-500/30",
      authority: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
      product_type: "bg-teal-500/20 text-teal-600 border-teal-500/30",
      tipo_transaccion: "bg-lime-500/20 text-lime-600 border-lime-500/30",
    };
    return colors[category] || "bg-gray-500/20 text-gray-600 border-gray-500/30";
  };

  const sortedTags = [...tags].sort((a, b) => b.count - a.count);

  return (
    <div
      className={`rounded-xl p-6 ${
        theme === "dark"
          ? "bg-slate-800/50 border border-slate-700"
          : "bg-white border border-gray-200 shadow-sm"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        Etiquetas Más Frecuentes
      </h3>

      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag, index) => {
          const sizeClass =
            tag.count > 5
              ? "text-lg px-4 py-2"
              : tag.count > 3
              ? "text-base px-3 py-2"
              : "text-sm px-3 py-1.5";

          return (
            <div
              key={index}
              className={`rounded-full border-2 font-medium transition-all hover:scale-105 cursor-pointer ${sizeClass} ${getCategoryColor(
                tag.category
              )}`}
              title={`Categoría: ${tag.category} | Confianza: ${(tag.avg_confidence * 100).toFixed(0)}%`}
            >
              <span>{tag.tag}</span>
              <span className="ml-2 text-xs opacity-70">({tag.count})</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <p
          className={`text-xs font-medium mb-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Categorías:
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(tags.map((t) => t.category))).map((cat) => (
            <span
              key={cat}
              className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(cat)}`}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}