'use client';

import { useState } from 'react';
import { SupportTicketDetail } from '@/app/user/types/types';
import { soporteService } from '@/app/user/services/soporte.service';
import { getAccessToken, getUser } from '@/app/services/auth.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketDetailViewProps {
  ticket: SupportTicketDetail;
  onClose: () => void;
  onUpdate: () => void;
  theme: 'light' | 'dark';
}

export function TicketDetailView({ ticket, onClose, onUpdate, theme }: TicketDetailViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const handleCloseTicket = async () => {
    if (!confirm('¿Está seguro de que desea cerrar este ticket?')) return;

    setLoading(true);
    setError(null);

    try {
      const user = getUser();
      const token = getAccessToken();

      if (!user?.id || !token) throw new Error('Autenticación requerida');

      const response = await soporteService.updateTicketStatus(
        ticket.id,
        {
          user_id: user.id,
          status: 'closed',
        },
        token
      );

      if (response.success) {
        onUpdate();
      } else {
        throw new Error(response.error || 'Error al cerrar el ticket');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = getUser();
      const token = getAccessToken();

      if (!user?.id || !token) throw new Error('Autenticación requerida');

      if (!responseMessage.trim()) {
        throw new Error('El mensaje no puede estar vacío');
      }

      const response = await soporteService.addResponse(
        ticket.id,
        {
          user_id: user.id,
          message: responseMessage,
          attachment_file: responseFile || undefined,
        },
        token
      );

      if (response.success) {
        setResponseMessage('');
        setResponseFile(null);
        setShowResponseForm(false);
        onUpdate();
      } else {
        throw new Error(response.error || 'Error al agregar respuesta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos PNG, JPG o PDF');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede superar los 5MB');
        return;
      }

      setResponseFile(file);
      setError(null);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 backdrop-blur-sm min-h-screen overflow-y-auto ${
        theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-xl shadow-2xl transition-all duration-300 my-8 overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-800 text-slate-100 border border-slate-700'
            : 'bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark'
              ? 'border-slate-700 bg-slate-800'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {ticket.subject}
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              ID: {ticket.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-3 rounded-lg transition-all hover:rotate-90 ${
              theme === 'dark'
                ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`flex gap-3 flex-wrap p-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
            ticket.status === 'open' ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800') :
            ticket.status === 'in_progress' ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800') :
            ticket.status === 'resolved' ? (theme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800') :
            (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
          }`}>
            {ticket.status === 'open' && '✅ Abierto'}
            {ticket.status === 'in_progress' && '🔄 Progreso'}
            {ticket.status === 'resolved' && '✓ Resuelto'}
            {ticket.status === 'closed' && '🔒 Cerrado'}
          </span>
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
            ticket.priority === 'low' ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800') :
            ticket.priority === 'medium' ? (theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800') :
            ticket.priority === 'high' ? (theme === 'dark' ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-800') :
            (theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
          }`}>
            {ticket.priority === 'low' && '🟢 Baja'}
            {ticket.priority === 'medium' && '🟡 Media'}
            {ticket.priority === 'high' && '🟠 Alta'}
            {ticket.priority === 'critical' && '🔴 Crítica'}
          </span>
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
          </span>
        </div>

        <div className={`p-6 max-h-96 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="mb-6">
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Descripción
            </h3>
            <p className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {ticket.description}
            </p>
            {ticket.attachment_url && (
              <a
                href={ticket.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 inline-block font-medium"
              >
                Ver adjunto
              </a>
            )}
          </div>

          {ticket.responses && ticket.responses.length > 0 && (
            <div className="mb-6">
              <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Respuestas ({ticket.responses.length})
              </h3>
              <div className="space-y-3">
                {ticket.responses.map(resp => (
                  <div key={resp.id} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {resp.user.full_name || resp.user.username}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {format(new Date(resp.created_at), 'dd MMM HH:mm', { locale: es })}
                        </p>
                      </div>
                      {resp.user.role === 'admin' && (
                        <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded">
                          Soporte
                        </span>
                      )}
                    </div>
                    <p className={`text-sm whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {resp.message}
                    </p>
                    {resp.attachment_url && (
                      <a
                        href={resp.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-xs mt-2 inline-block font-medium"
                      >
                        Ver adjunto
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm border-l-4 border-red-500 ${theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}

          {!showResponseForm ? (
            ticket.status !== 'closed' && (
              <button
                onClick={() => setShowResponseForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-all"
              >
                Agregar Respuesta
              </button>
            )
          ) : (
            <form onSubmit={handleAddResponse} className={`p-4 rounded-lg space-y-3 ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <textarea
                value={responseMessage}
                onChange={e => setResponseMessage(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={loading}
              />

              <div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.pdf"
                  className={`text-sm file:px-4 file:py-2 file:rounded-lg file:border-0 file:font-semibold file:cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'text-gray-400 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700'
                      : 'text-gray-600 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200'
                  }`}
                  disabled={loading}
                />
                {responseFile && (
                  <p className="mt-2 text-xs text-green-500 font-medium">
                    {responseFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-all"
                >
                  {loading ? 'Enviando...' : '✓ Enviar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseMessage('');
                    setResponseFile(null);
                  }}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        <div className={`border-t p-4 flex justify-end gap-3 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✕ Cerrar
          </button>
          {ticket.status !== 'closed' && (
            <button
              onClick={handleCloseTicket}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 font-medium transition-all"
            >
              {loading ? 'Cerrando...' : 'Cerrar Ticket'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}