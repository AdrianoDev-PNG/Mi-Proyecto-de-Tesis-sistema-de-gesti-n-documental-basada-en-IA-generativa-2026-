'use client';

import { useState } from 'react';
import { soporteService } from '@/app/user/services/soporte.service';
import { getAccessToken, getUser } from '@/app/services/auth.service';

interface CreateTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme: 'light' | 'dark';
}

export function CreateTicketDialog({
  isOpen,
  onClose,
  onSuccess,
  theme,
}: CreateTicketDialogProps) {
  const user = getUser();
  const token = getAccessToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

      setAttachmentFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = getUser();
      const token = getAccessToken();

      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      if (!token) {
        throw new Error('Token no disponible');
      }

      if (!formData.subject.trim() || !formData.description.trim()) {
        throw new Error('El asunto y descripción son requeridos');
      }

      const response = await soporteService.createTicket(
        {
          user_id: user.id,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          attachment_file: attachmentFile || undefined,
        },
        token
      );

      if (response.success) {
        setFormData({
          subject: '',
          description: '',
          priority: 'medium',
        });
        setAttachmentFile(null);
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Error al crear el ticket');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 backdrop-blur-sm min-h-screen ${
        theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800 text-slate-100 border border-slate-700'
            : 'bg-white text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-md ${
            theme === 'dark'
              ? 'border-slate-700 bg-slate-800/95'
              : 'border-slate-200 bg-white/95'
          }`}
        >
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Crear Ticket
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Envía una solicitud de soporte
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-3 rounded-xl transition-all hover:rotate-90 ${
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

        <div className="p-6 space-y-4">
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm border-l-4 border-red-500 ${theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Asunto *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Describe brevemente el problema"
                className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="priority" className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Prioridad
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={loading}
              >
                <option value="low">🟢 Baja</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🟠 Alta</option>
                <option value="critical">🔴 Crítica</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Descripción *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe el problema en detalle"
                rows={4}
                className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="attachment" className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Archivo adjunto (opcional)
              </label>
              <input
                type="file"
                id="attachment"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.pdf"
                className={`w-full text-sm file:rounded-lg file:border-0 file:font-semibold file:cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'text-gray-400 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700'
                    : 'text-gray-600 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200'
                }`}
                disabled={loading}
              />
              {attachmentFile && (
                <p className="mt-2 text-sm text-green-500 font-medium">
                  ✓ {attachmentFile.name}
                </p>
              )}
              <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                PNG, JPG, PDF - Máx 5MB
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                }`}
              >
                ✕ Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Creando...
                  </>
                ) : (
                  '✓ Crear Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

