// app/user/Dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getAccessToken } from "../../services/auth.service";
import { dashboardService, DashboardStats } from "../services/dashboard.service";
import MetricsCards from "./components/MetricsCards";
import DocumentsChart from "./components/DocumentsChart";
import DocumentTypesChart from "./components/DocumentTypesChart";
import TagsCloud from "./components/TagsCloud";
import FinancialSummary from "./components/FinancialSummary";
import RecentActivity from "./components/RecentActivity";
import TopEntities from "./components/TopEntities";
import TopItems from "./components/TopItems";

export default function DashboardHome() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) return;

      const data = await dashboardService.getStats(selectedPeriod);
      setStats(data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className={`animate-spin rounded-full h-16 w-16 border-t-4 ${
            theme === "dark" ? "border-indigo-500" : "border-blue-600"
          }`}
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No se pudieron cargar las estadísticas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1
          className={`text-3xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          📊 Dashboard
        </h1>
        
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === days
                  ? theme === "dark"
                    ? "bg-indigo-600 text-white"
                    : "bg-blue-600 text-white"
                  : theme === "dark"
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {days} días
            </button>
          ))}
        </div>
      </div>

      <MetricsCards overview={stats.overview} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentsChart timeline={stats.documents_timeline} />
        <DocumentTypesChart types={stats.document_types} />
      </div>

      <FinancialSummary summary={stats.financial_summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TagsCloud tags={stats.top_tags} />
        <RecentActivity activities={stats.recent_activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopEntities entities={stats.top_entities} />
        <div className="lg:col-span-2">
          <TopItems items={stats.top_items} />
        </div>
      </div>

      <div
        className={`rounded-xl p-6 ${
          theme === "dark"
            ? "bg-slate-800/50 border border-slate-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Estadísticas de Procesamiento
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Total Batches
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {stats.processing_stats.total_batches}
            </p>
          </div>

          <div>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Completados
            </p>
            <p className="text-2xl font-bold text-green-500">
              {stats.processing_stats.completed_batches}
            </p>
          </div>

          <div>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Fallidos
            </p>
            <p className="text-2xl font-bold text-red-500">
              {stats.processing_stats.failed_batches}
            </p>
          </div>

          <div>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              En Proceso
            </p>
            <p className="text-2xl font-bold text-yellow-500">
              {stats.processing_stats.processing_batches}
            </p>
          </div>

          <div>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Tiempo Promedio
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {stats.processing_stats.avg_processing_time_formatted}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}