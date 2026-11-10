// src/app/soporte/tickets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";
import { getAccessToken } from "@/app/services/auth.service";
import { ticketsService } from "../services/tickets.service";
import { SupportTicket, TicketPriority, PRIORITY_COLORS, PriorityColorType } from "../types/soporte.type";
import { useToast } from "@/app/hook/useToast";
import Toast from "@/app/context/Toast";
import { Clock, User, Eye } from "lucide-react";

export default function TicketsDisponibles() {
  const router = useRouter();
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const token = getAccessToken();

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTickets = async () => {
    try {
      if (!token) {
        router.push("/");
        return;
      }
      
      const res = await ticketsService.getAvailable(token, { 
        status: 'open', 
        limit: 50 
      });
      
      if (res.success) {
        setTickets(res.tickets);
      } else {
        showToast("error", res.error || "Error al cargar tickets");
      }
    } catch (error) {
      console.error("Error cargando tickets:", error);
      showToast("error", "Error al cargar tickets");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: TicketPriority): PriorityColorType => {
    return PRIORITY_COLORS[priority] || 'blue';
  };

  const getPriorityLabel = (priority: TicketPriority): string => {
    const labels = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return labels[priority] || priority;
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/soporte/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
          theme === "dark" 
            ? "border-slate-700 border-t-indigo-500" 
            : "border-gray-200 border-t-indigo-600"
        }`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={hideToast} 
        />
      )}

      <div className={`rounded-xl p-6 ${
        theme === "dark"
          ? "bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-700/50"
          : "bg-gradient-to-r from-blue-500 to-indigo-600"
      }`}>
        <h1 className="text-3xl font-bold text-white mb-2">
          Tickets Disponibles
        </h1>
        <p className="text-blue-100">
          {tickets.length} {tickets.length === 1 ? 'ticket sin asignar' : 'tickets sin asignar'}
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${
          theme === "dark" 
            ? "border-slate-600 bg-slate-800/30" 
            : "border-gray-300 bg-gray-50"
        }`}>
          <p className="text-4xl mb-2">🎉</p>
          <p className={`text-lg font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            No hay tickets disponibles
          </p>
          <p className={`text-sm mt-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Todos los tickets están asignados o resueltos
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tickets.map((ticket) => {
            const priorityColor = getPriorityColor(ticket.priority);
            return (
              <div
                key={ticket.id}
                onClick={() => handleTicketClick(ticket.id)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20"
                    : "bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg"
                }`}>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    priorityColor === 'red' 
                      ? 'bg-red-500/20 text-red-400'
                      : priorityColor === 'orange'
                      ? 'bg-orange-500/20 text-orange-400'
                      : priorityColor === 'yellow'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTicketClick(ticket.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "hover:bg-slate-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    title="Ver detalles">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {ticket.subject}
                </h3>
                
                <p className={`text-sm mb-4 line-clamp-2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  {ticket.description}
                </p>

                <div className="flex items-center gap-4 text-sm pt-3 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                      {ticket.creator_username || "Usuario"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                      {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-center ${
                  theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                }`}>
                  <span className="text-sm font-medium">
                    Click para ver detalles y asignarte →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}