"use client";

import { useTheme } from "../../../context/ThemeContext";
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  ChartBarIcon,
  ServerIcon
} from "@heroicons/react/24/outline";

interface MetricsCardsProps {
  overview: {
    total_documents: number;
    pending: number;
    completed: number;
    processing: number;
    failed: number;
    success_rate: number;
    total_storage: string;
    total_items_cataloged: number;
  };
}

export default function MetricsCards({ overview }: MetricsCardsProps) {
  const { theme } = useTheme();

  const cards = [
    {
      title: "Total Documentos",
      value: overview.total_documents,
      icon: DocumentTextIcon,
      color: "blue",
      bgColor: theme === "dark" ? "bg-blue-500/10" : "bg-blue-50",
      textColor: "text-blue-500",
    },
    {
      title: "Completados",
      value: overview.completed,
      icon: CheckCircleIcon,
      color: "green",
      bgColor: theme === "dark" ? "bg-green-500/10" : "bg-green-50",
      textColor: "text-green-500",
    },
    {
      title: "En Proceso",
      value: overview.processing,
      icon: ClockIcon,
      color: "yellow",
      bgColor: theme === "dark" ? "bg-yellow-500/10" : "bg-yellow-50",
      textColor: "text-yellow-500",
    },
    {
      title: "Pendientes",
      value: overview.pending,
      icon: ClockIcon,
      color: "orange",
      bgColor: theme === "dark" ? "bg-orange-500/10" : "bg-orange-50",
      textColor: "text-orange-500",
    },
    {
      title: "Fallidos",
      value: overview.failed,
      icon: XCircleIcon,
      color: "red",
      bgColor: theme === "dark" ? "bg-red-500/10" : "bg-red-50",
      textColor: "text-red-500",
    },
    {
      title: "Tasa de Éxito",
      value: `${overview.success_rate}%`,
      icon: ChartBarIcon,
      color: "purple",
      bgColor: theme === "dark" ? "bg-purple-500/10" : "bg-purple-50",
      textColor: "text-purple-500",
    },
    {
      title: "Almacenamiento",
      value: overview.total_storage,
      icon: ServerIcon,
      color: "indigo",
      bgColor: theme === "dark" ? "bg-indigo-500/10" : "bg-indigo-50",
      textColor: "text-indigo-500",
    },
    {
      title: "Items Catalogados",
      value: overview.total_items_cataloged,
      icon: DocumentTextIcon,
      color: "pink",
      bgColor: theme === "dark" ? "bg-pink-500/10" : "bg-pink-50",
      textColor: "text-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={index}
            className={`rounded-xl p-6 transition-all hover:scale-105 ${
              theme === "dark"
                ? "bg-slate-800/50 border border-slate-700"
                : "bg-white border border-gray-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
              
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  theme === "dark"
                    ? "bg-slate-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Live
              </span>
            </div>

            <h3
              className={`text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {card.title}
            </h3>

            <p
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {card.value.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}