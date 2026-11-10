"use client";

import { useTheme } from "../../../context/ThemeContext";
import { CurrencyDollarIcon, DocumentTextIcon, ChartBarIcon } from "@heroicons/react/24/outline";

interface FinancialSummaryProps {
  summary: Array<{
    currency: string;
    total_amount: number;
    document_count: number;
    average: number;
  }>;
}

export default function FinancialSummary({ summary }: FinancialSummaryProps) {
  const { theme } = useTheme();

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      PEN: "S/",
      USD: "$",
      EUR: "€",
    };
    return symbols[currency] || currency;
  };

  const getCurrencyColor = (currency: string) => {
    const colors: Record<string, string> = {
      PEN: "from-green-500 to-emerald-600",
      USD: "from-blue-500 to-indigo-600",
      EUR: "from-purple-500 to-violet-600",
    };
    return colors[currency] || "from-gray-500 to-gray-600";
  };

  return (
    <div
      className={`rounded-xl p-6 ${
        theme === "dark"
          ? "bg-slate-800/50 border border-slate-700"
          : "bg-white border border-gray-200 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-lg font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Resumen Financiero
        </h3>
        <CurrencyDollarIcon
          className={`h-6 w-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary.map((item, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${getCurrencyColor(
              item.currency
            )} text-white`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold opacity-20">
                  {getCurrencySymbol(item.currency)}
                </span>
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                  {item.currency}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm opacity-80 mb-1">Total Acumulado</p>
                <p className="text-3xl font-bold">
                  {getCurrencySymbol(item.currency)}{" "}
                  {item.total_amount.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DocumentTextIcon className="h-4 w-4" />
                    <p className="text-xs opacity-80">Documentos</p>
                  </div>
                  <p className="text-lg font-semibold">{item.document_count}</p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <ChartBarIcon className="h-4 w-4" />
                    <p className="text-xs opacity-80">Promedio</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {getCurrencySymbol(item.currency)}{" "}
                    {item.average.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          </div>
        ))}
      </div>
    </div>
  );
}