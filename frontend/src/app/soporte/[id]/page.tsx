// src/app/soporte/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";
import { getAccessToken, getUser } from "@/app/services/auth.service";
import { ticketsService } from "../services/tickets.service";
import { SupportTicketDetail, TicketStatus } from "../types/soporte.type";
import { useToast } from "@/app/hook/useToast";
import Toast from "@/app/context/Toast";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import { ArrowLeft, User, Clock, Send, AlertCircle, Paperclip, X } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  role: string;
}

export default function TicketDetail() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const user = getUser() as UserData | null;
  const token = getAccessToken();

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      if (!user?.id || !token) {
        router.push("/soporte");
        return;
      }

      setLoading(true);
      const res = await ticketsService.getDetail(ticketId, user.id, token);
      
      if (res.success && res.ticket) {
        setTicket(res.ticket);
      } else {
        showToast("error", res.error || "Error al cargar el ticket");
        router.push("/soporte/tickets");
      }
    } catch (error) {
      console.error("Error cargando ticket:", error);
      showToast("error", "Error al cargar el ticket");
      router.push("/soporte/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      if (!user?.id || !token) return;
      
      setAssigning(true);
      const res = await ticketsService.assignToSelf(ticketId, user.id, token);
      
      if (res.success) {
        showToast("success", "Ticket asignado exitosamente");
        await loadTicket();
      } else {
        showToast("error", res.error || "Error al asignar ticket");
      }
    } catch (error) {
      console.error("Error asignando ticket:", error);
      showToast("error", "Error al asignar el ticket");
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = (status: TicketStatus) => {
    setNewStatus(status);
    setShowModal(true);
  };

  const confirmUpdate = async () => {
    try {
      if (!user?.id || !token || !newStatus) return;
      
      const res = await ticketsService.updateStatus(ticketId, user.id, newStatus, token);
      
      if (res.success) {
        showToast("success", "Estado actualizado");
        setShowModal(false);
        await loadTicket();
      } else {
        showToast("error", res.error || "Error al actualizar");
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
      showToast("error", "Error al actualizar estado");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "El archivo debe ser menor a 5MB");
        return;
      }
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showToast("error", "Solo se permiten imágenes (JPG, PNG, GIF) o PDF");
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendResponse = async () => {
    try {
      if (!message.trim() || !user?.id || !token) return;
      
      setSending(true);
      const res = await ticketsService.addResponse(
        ticketId, 
        user.id, 
        message, 
        false, 
        attachment || undefined, 
        token
      );
      
      if (res.success) {
        showToast("success", attachment ? "Respuesta y archivo enviados" : "Respuesta enviada");
        setMessage("");
        setAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadTicket();
      } else {
        showToast("error", res.error || "Error al enviar");
      }
    } catch (error) {
      console.error("Error enviando respuesta:", error);
      showToast("error", "Error al enviar respuesta");
    } finally {
      setSending(false);
    }
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

  if (!ticket) return null;

  const isAssignedToMe = ticket.assigned_to === user?.id;
  const canAssign = !ticket.assigned_to;
  // Un ticket está cerrado si tiene status 'closed' O si tiene closed_at establecido
  const isClosed = ticket.status === 'closed' || !!ticket.closed_at;
  const canRespond = isAssignedToMe && !isClosed;

  return (
    <div className="space-y-6">
      {toast.show && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}

      {/* Botón volver */}
      <button
        onClick={() => router.back()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          theme === "dark" 
            ? "hover:bg-slate-700 text-gray-300" 
            : "hover:bg-gray-100 text-gray-700"
        }`}>
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      {/* Header del ticket */}
      <div className={`rounded-xl border p-6 ${
        theme === "dark" 
          ? "bg-slate-800 border-slate-700" 
          : "bg-white border-gray-200"
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                ticket.priority === 'critical' 
                  ? 'bg-red-500/20 text-red-400'
                  : ticket.priority === 'high'
                  ? 'bg-orange-500/20 text-orange-400'
                  : ticket.priority === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {ticket.priority.toUpperCase()}
              </span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                ticket.status === 'open'
                  ? 'bg-green-500/20 text-green-400'
                  : ticket.status === 'in_progress'
                  ? 'bg-blue-500/20 text-blue-400'
                  : ticket.status === 'resolved'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {ticket.status === 'open' ? 'ABIERTO' :
                 ticket.status === 'in_progress' ? 'EN PROGRESO' :
                 ticket.status === 'resolved' ? 'RESUELTO' :
                 'CERRADO'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {canAssign && (
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all">
                {assigning ? "Asignando..." : "Asignarme este ticket"}
              </button>
            )}

            {isAssignedToMe && !isClosed && (
              <div className="flex gap-2">
                {ticket.status === 'open' && (
                  <button 
                    onClick={() => handleUpdateStatus('in_progress')} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    En Progreso
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button 
                    onClick={() => handleUpdateStatus('resolved')} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                    Marcar Resuelto
                  </button>
                )}
                {ticket.status === 'resolved' && (
                  <button 
                    onClick={() => handleUpdateStatus('closed')} 
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors">
                    Cerrar Ticket
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                Usuario
              </p>
              <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {ticket.user_contact?.full_name || ticket.user_contact?.username || "Sin nombre"}
              </p>
              {ticket.user_contact?.email && (
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {ticket.user_contact.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                Creado
              </p>
              <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                Estado de asignación
              </p>
              <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {canAssign ? "Sin asignar" : isAssignedToMe ? "Asignado a mí" : "Asignado a otro"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl border p-6 ${
        theme === "dark" 
          ? "bg-slate-800 border-slate-700" 
          : "bg-white border-gray-200"
      }`}>
        <h2 className={`text-lg font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          Descripción
        </h2>
        <p className={`whitespace-pre-wrap ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>
          {ticket.description}
        </p>
        {ticket.attachment_url && (
          <div className="mt-4">
            <a 
              href={ticket.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors">
              <Paperclip className="w-4 h-4" />
              Ver archivo adjunto
            </a>
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-6 ${
        theme === "dark" 
          ? "bg-slate-800 border-slate-700" 
          : "bg-white border-gray-200"
      }`}>
        <h2 className={`text-lg font-bold mb-6 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          💬 Conversación ({ticket.responses.length})
        </h2>

        {ticket.responses.length === 0 ? (
          <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
            theme === "dark" 
              ? "border-slate-600 bg-slate-700/30" 
              : "border-gray-300 bg-gray-50"
          }`}>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              No hay respuestas aún
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {ticket.responses.map((resp) => (
              <div
                key={resp.id}
                className={`p-4 rounded-lg border ${
                  resp.is_internal_note
                    ? theme === "dark"
                      ? "bg-yellow-900/20 border-yellow-700"
                      : "bg-yellow-50 border-yellow-300"
                    : theme === "dark"
                    ? "bg-slate-700/50 border-slate-600"
                    : "bg-gray-50 border-gray-200"
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    resp.user.role === 'soporte' || resp.user.role === 'administrador'
                      ? 'bg-indigo-500'
                      : 'bg-green-500'
                  }`}>
                    {resp.user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {resp.user.full_name || resp.user.username}
                      </p>
                      {(resp.user.role === 'soporte' || resp.user.role === 'administrador') && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded">
                          SOPORTE
                        </span>
                      )}
                      {resp.is_internal_note && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">
                          NOTA INTERNA
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {new Date(resp.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                <p className={`whitespace-pre-wrap ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  {resp.message}
                </p>
                {resp.attachment_url && (
                  <div className="mt-3">
                    <a 
                      href={resp.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded text-sm hover:bg-indigo-500/20 transition-colors">
                      <Paperclip className="w-3.5 h-3.5" />
                      Ver archivo
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {canRespond && (
          <div className="border-t pt-6 space-y-4 border-gray-200 dark:border-slate-700">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu respuesta al usuario..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border resize-none ${
                theme === "dark" 
                  ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400" 
                  : "bg-white border-gray-300 placeholder-gray-500"
              }`}
            />
            
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  theme === "dark"
                    ? "border-slate-600 hover:bg-slate-700 text-gray-300"
                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}>
                <Paperclip className="w-4 h-4" />
                Adjuntar archivo
              </label>
              
              {attachment && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  theme === "dark" ? "bg-slate-700" : "bg-gray-100"
                }`}>
                  <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    {attachment.name}
                  </span>
                  <button
                    onClick={removeAttachment}
                    className="text-red-400 hover:text-red-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSendResponse}
              disabled={sending || !message.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all">
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar Respuesta"}
            </button>
          </div>
        )}

        {isClosed && (
          <div className={`mt-6 p-4 rounded-lg border-2 border-dashed ${
            theme === "dark" 
              ? "border-slate-600 bg-slate-700/30" 
              : "border-gray-300 bg-gray-50"
          }`}>
            <p className={`text-sm text-center ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              🔒 Este ticket está cerrado y no acepta más respuestas
            </p>
          </div>
        )}

        {!canRespond && !isClosed && !canAssign && (
          <div className={`mt-6 p-4 rounded-lg border-2 border-dashed ${
            theme === "dark" 
              ? "border-slate-600 bg-slate-700/30" 
              : "border-gray-300 bg-gray-50"
          }`}>
            <p className={`text-sm text-center ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              Asígnate este ticket para poder responder
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmUpdate}
        title="Cambiar estado del ticket"
        message={`¿Confirmas cambiar el estado a "${newStatus === 'in_progress' ? 'En Progreso' : newStatus === 'resolved' ? 'Resuelto' : 'Cerrado'}"?`}
        confirmButtonText="Confirmar"
        confirmButtonVariant="primary"
      />
    </div>
  );
}