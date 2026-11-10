"use client";

import { useTheme } from "../../../context/ThemeContext";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  DocumentTextIcon 
} from "@heroicons/react/24/solid";

interface RecentActivityProps {
  activities: Array<{
    id: string;
    filename: string;
    type: string;
    state: string;
    uploaded: string;
    processed?: string;
    processing_time?: string;
  }>;
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const { theme } = useTheme();

  const getStateIcon = (state: string) => {
    switch (state) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "processing":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStateText = (state: string) => {
    const states: Record<string, string> = {
      completed: "Completado",
      processing: "Procesando",
      pending: "Pendiente",
      failed: "Fallido",
    };
    return states[state] || state;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
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
        Actividad Reciente
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:scale-[1.02] ${
              theme === "dark"
                ? "bg-slate-700/30 hover:bg-slate-700/50"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {getStateIcon(activity.state)}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
                title={activity.filename}
              >
                {activity.filename}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activity.state === "completed"
                      ? "bg-green-500/20 text-green-600"
                      : activity.state === "processing"
                      ? "bg-yellow-500/20 text-yellow-600"
                      : activity.state === "failed"
                      ? "bg-red-500/20 text-red-600"
                      : "bg-gray-500/20 text-gray-600"
                  }`}
                >
                  {getStateText(activity.state)}
                </span>

                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {activity.type}
                </span>
              </div>

              <p
                className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {formatDate(activity.uploaded)}
              </p>
            </div>

            <div
              className={`flex-shrink-0 text-xs font-semibold ${
                theme === "dark" ? "text-gray-600" : "text-gray-400"
              }`}
            >
              #{index + 1}
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div
          className={`text-center py-8 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay actividad reciente</p>
        </div>
      )}
    </div>
  );
}