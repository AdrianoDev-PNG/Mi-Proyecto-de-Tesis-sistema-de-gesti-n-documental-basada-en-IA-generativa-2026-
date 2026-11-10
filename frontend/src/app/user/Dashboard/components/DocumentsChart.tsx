"use client";

import { useTheme } from "../../../context/ThemeContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DocumentsChartProps {
  timeline: Array<{
    date: string;
    count: number;
    completed: number;
    failed: number;
  }>;
}

export default function DocumentsChart({ timeline }: DocumentsChartProps) {
  const { theme } = useTheme();

  const chartData = {
    labels: timeline.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Total",
        data: timeline.map((item) => item.count),
        borderColor: theme === "dark" ? "#6366f1" : "#3b82f6",
        backgroundColor: theme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Completados",
        data: timeline.map((item) => item.completed),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Fallidos",
        data: timeline.map((item) => item.failed),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        titleColor: theme === "dark" ? "#f3f4f6" : "#111827",
        bodyColor: theme === "dark" ? "#e5e7eb" : "#374151",
        borderColor: theme === "dark" ? "#334155" : "#e5e7eb",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: theme === "dark" ? "#334155" : "#e5e7eb",
        },
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
        },
      },
      x: {
        grid: {
          color: theme === "dark" ? "#334155" : "#e5e7eb",
        },
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
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
        Documentos por Día
      </h3>

      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}