// src/app/soporte/mis-tickets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";
import { getAccessToken, getUser } from "@/app/services/auth.service";
import { ticketsService } from "../services/tickets.service";
import { SupportTicket, TicketStatus, STATUS_COLORS, TICKET_STATUS, StatusColorType } from "../types/soporte.type";
import { useToast } from "@/app/hook/useToast";
import Toast from "@/app/context/Toast";
import { Clock, User } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  role: string;
}

export default function MisTickets() {
  const router = useRouter();
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getUser() as UserData | null;
  const token = getAccessToken();

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTickets = async () => {
    try {
      if (!user?.id || !token) return;
      const res = await ticketsService.getAssigned(token, user.id, { limit: 20 });
      if (res.success) setTickets(res.tickets);
    } catch (error) {
      console.error("Error cargando tickets:", error);
      showToast("error", "Error al cargar tus tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TicketStatus): StatusColorType => {
    return STATUS_COLORS[status] || 'gray';
  };

  const getStatusLabel = (status: TicketStatus): string => {
    return TICKET_STATUS[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
          theme === "dark" ? "border-slate-700 border-t-indigo-500" : "border-gray-200 border-t-indigo-600"
        }`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.show && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}

      {/* Header */}
      <div className={`rounded-xl p-6 ${
        theme === "dark"
          ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700/50"
          : "bg-gradient-to-r from-purple-500 to-pink-600"
      }`}>
        <h1 className="text-3xl font-bold text-white mb-2">💼 Mis Tickets</h1>
        <p className="text-purple-100">{tickets.length} tickets asignados a ti</p>
      </div>

      {/* Lista */}
      {tickets.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${
          theme === "dark" ? "border-slate-600 bg-slate-800/30" : "border-gray-300 bg-gray-50"
        }`}>
          <p className="text-4xl mb-2">📭</p>
          <p className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            No tienes tickets asignados
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tickets.map((ticket) => {
            const statusColor = getStatusColor(ticket.status);
            const statusLabel = getStatusLabel(ticket.status);
            
            return (
              <div
                key={ticket.id}
                onClick={() => router.push(`/soporte/${ticket.id}`)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 hover:border-purple-500"
                    : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg"
                }`}>z
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-${statusColor}-500/20 text-${statusColor}-400`}>
                  {statusLabel}
                </span>

                <h3 className={`text-lg font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {ticket.subject}
                </h3>
                <p className={`text-sm mb-4 line-clamp-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {ticket.description}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                      {ticket.creator_username || "Usuario"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}