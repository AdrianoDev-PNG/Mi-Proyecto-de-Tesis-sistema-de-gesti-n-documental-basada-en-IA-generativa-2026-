"use client";

import { useTheme } from "../../../context/ThemeContext";
import { ShoppingBagIcon, TrophyIcon } from "@heroicons/react/24/outline";

interface TopItemsProps {
  items: Array<{
    name: string;
    count: number;
    total_value: number;
    currency: string;
  }>;
}

export default function TopItems({ items }: TopItemsProps) {
  const { theme } = useTheme();

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      PEN: "S/",
      USD: "$",
      EUR: "€",
    };
    return symbols[currency] || currency;
  };

  const getRankColor = (index: number) => {
    if (index === 0)
      return theme === "dark"
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        : "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (index === 1)
      return theme === "dark"
        ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
        : "bg-gray-100 text-gray-700 border-gray-300";
    if (index === 2)
      return theme === "dark"
        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
        : "bg-orange-100 text-orange-700 border-orange-300";
    return theme === "dark"
      ? "bg-slate-700 text-gray-400 border-slate-600"
      : "bg-gray-50 text-gray-600 border-gray-200";
  };

  const maxCount = items[0]?.count || 1;

  return (
    <div
      className={`rounded-xl p-6 ${
        theme === "dark"
          ? "bg-slate-800/50 border border-slate-700"
          : "bg-white border border-gray-200 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-indigo-500/10" : "bg-indigo-50"
            }`}
          >
            <ShoppingBagIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Top Items/Productos
          </h3>
        </div>

        <TrophyIcon
          className={`h-6 w-6 ${
            theme === "dark" ? "text-yellow-500" : "text-yellow-600"
          }`}
        />
      </div>

      <div className="space-y-3">
        {items.slice(0, 10).map((item, index) => {
          const percentage = (item.count / maxCount) * 100;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                theme === "dark"
                  ? "bg-slate-700/30 border-slate-600 hover:bg-slate-700/50"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-bold ${getRankColor(
                    index
                  )}`}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </p>

                  <div
                    className={`h-2 rounded-full overflow-hidden mb-2 ${
                      theme === "dark" ? "bg-slate-600" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <span className="font-semibold text-indigo-500">
                          {item.count}
                        </span>{" "}
                        veces
                      </span>

                      <span
                        className={`text-xs ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Valor:{" "}
                        <span
                          className={`font-semibold ${
                            item.total_value >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {getCurrencySymbol(item.currency)}{" "}
                          {Math.abs(item.total_value).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        theme === "dark"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {item.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div
            className={`text-center py-8 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <ShoppingBagIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay items catalogados</p>
          </div>
        )}
      </div>
    </div>
  );
}