"use client";

import { useTheme } from "../../../context/ThemeContext";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DocumentType {
  type: string;
  count: number;
  percentage: number;
}

interface DocumentTypesChartProps {
  types: DocumentType[];
}

export default function DocumentTypesChart({ types }: DocumentTypesChartProps) {
  const { theme } = useTheme();

  const colors = [
    { bg: "rgba(99, 102, 241, 0.8)", border: "rgba(99, 102, 241, 1)" },
    { bg: "rgba(16, 185, 129, 0.8)", border: "rgba(16, 185, 129, 1)" },
    { bg: "rgba(251, 146, 60, 0.8)", border: "rgba(251, 146, 60, 1)" },
    { bg: "rgba(236, 72, 153, 0.8)", border: "rgba(236, 72, 153, 1)" },
    { bg: "rgba(168, 85, 247, 0.8)", border: "rgba(168, 85, 247, 1)" },
  ];

  const chartData = {
    labels: types.map((t) => t.type),
    datasets: [
      {
        data: types.map((t) => t.count),
        backgroundColor: types.map((_, i) => colors[i % colors.length].bg),
        borderColor: types.map((_, i) => colors[i % colors.length].border),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        titleColor: theme === "dark" ? "#f3f4f6" : "#111827",
        bodyColor: theme === "dark" ? "#e5e7eb" : "#374151",
        borderColor: theme === "dark" ? "#334155" : "#e5e7eb",
        borderWidth: 1,
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const percentage = types[context.dataIndex]?.percentage || 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

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
        Tipos de Documentos
      </h3>

      <div className="h-80 flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
      </div>

      <div className="mt-4 space-y-2">
        {types.map((type, index) => (
          <div
            key={index}
            className={`flex justify-between items-center p-2 rounded-lg ${
              theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length].border }}
              />
              <span
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {type.type}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {type.count} ({type.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}