// src/app/soporte/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";
import { Ticket, Inbox} from "lucide-react";

export default function SoporteDashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  const quickActions = [
    {
      title: "Ver tickets disponibles",
      description: "Tickets sin asignar esperando atención",
      path: "/soporte/tickets",
      icon: <Inbox className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Ver mis tickets",
      description: "Tickets asignados a ti actualmente",
      path: "/soporte/mis-tickets",
      icon: <Ticket className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
        theme === "dark"
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-gray-200"
      }`}>
        <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          👋 Bienvenido al Centro de Soporte
        </h2>
        <p className={`text-sm transition-colors duration-300 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Gestiona tickets y brinda soporte a los usuarios
        </p>
      </div>  

      {/* Quick Actions */}
      <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
        theme === "dark"
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-gray-200"
      }`}>
        <h2 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          ⚡ Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.path)}
              className={`p-5 rounded-lg text-left transition-all duration-300 ${
                theme === "dark"
                  ? "bg-slate-700/50 hover:bg-slate-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${action.color}`}>
                  <div className="text-white">{action.icon}</div>
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold mb-1 transition-colors duration-300 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {action.title}
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
        theme === "dark"
          ? "bg-indigo-900/20 border-indigo-700/50"
          : "bg-indigo-50 border-indigo-200"
      }`}>
        <h3 className={`font-bold mb-3 flex items-center gap-2 transition-colors duration-300 ${
          theme === "dark" ? "text-indigo-300" : "text-indigo-700"
        }`}>
          💡 Consejo del día
        </h3>
        <p className={`text-sm transition-colors duration-300 ${
          theme === "dark" ? "text-indigo-200" : "text-indigo-900"
        }`}>
          Responde a los tickets de prioridad alta primero para mantener la satisfacción del cliente.
          Recuerda usar notas internas para comunicarte con tu equipo sin que el usuario lo vea.
        </p>
      </div>
    </div>
  );
}