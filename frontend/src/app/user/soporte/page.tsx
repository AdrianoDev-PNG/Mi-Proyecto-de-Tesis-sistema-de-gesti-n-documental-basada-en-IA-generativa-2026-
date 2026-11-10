'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { getAccessToken, getUser } from '@/app/services/auth.service';
import { soporteService } from '../services/soporte.service';
import { SupportTicket, SupportTicketDetail } from '../types/types';
import { CreateTicketDialog, TicketsTable, TicketDetailView } from './components';

type FilterStatus = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

export default function SoportePage() {
  const { theme } = useTheme();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const user = getUser();
  const token = getAccessToken();

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await soporteService.listTickets(
        user.id,
        token,
        {
          status: filterStatus === 'all' ? undefined : filterStatus,
          page: currentPage,
          limit: 10,
        }
      );

      if (response.success) {
        setTickets(response.tickets);
      } else {
        throw new Error('Error al cargar los tickets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, currentPage, user?.id, token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleTicketClick = async (ticket: SupportTicket) => {
    try {
      if (!user?.id || !token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await soporteService.getTicketDetail(ticket.id, user.id, token);

      if (response.success) {
        setSelectedTicket(response.ticket);
      } else {
        throw new Error('Error al obtener detalles del ticket');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleTicketSuccess = () => {
    loadTickets();
    setSelectedTicket(null);
  };

  const getStatusBadgeColor = (status: FilterStatus) => {
    const isActive = filterStatus === status;
    return isActive
      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
      : theme === 'dark'
      ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-slate-600'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
  };

  return (
    <div className={`min-h-screen space-y-8 ${theme === 'dark' ? 'space-y-6' : 'bg-gray-50'}`}>
      <div className={`rounded-xl p-8 ${theme === 'dark' ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-700' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Soporte
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-indigo-50'}`}>
              Crea tickets de soporte para reportar problemas o solicitar ayuda. Nuestro equipo te responderá lo antes posible.
            </p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            + Nuevo Ticket
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-lg border-l-4 border-red-500 ${theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      <div>
        <p className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-indigo-900'}`}>
          Filtrar por estado
        </p>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status as FilterStatus);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${getStatusBadgeColor(
                status as FilterStatus
              )}`}
            >
              {status === 'all'
                ? 'Todos'
                : status === 'open'
                ? 'Abiertos'
                : status === 'in_progress'
                ? 'En Progreso'
                : status === 'resolved'
                ? 'Resueltos'
                : 'Cerrados'}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`rounded-xl border overflow-hidden shadow-md ${
          theme === 'dark'
            ? 'border-slate-700 bg-slate-800'
            : 'border-gray-200 bg-white'
        }`}
      >
        <TicketsTable
          tickets={tickets}
          onTicketClick={handleTicketClick}
          loading={loading}
          theme={theme}
        />
      </div>

      <CreateTicketDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleTicketSuccess}
        theme={theme}
      />

      {selectedTicket && (
        <TicketDetailView
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketSuccess}
          theme={theme}
        />
      )}

      {!loading && tickets.length === 0 && (
        <div
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-all ${
            theme === 'dark'
              ? 'border-slate-600 bg-slate-800/50'
              : 'border-indigo-300 bg-indigo-50/50'
          }`}
        >
          <p className="text-3xl mb-2">📭</p>
          <p
            className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-gray-300' : 'text-indigo-900'
            }`}
          >
            No hay tickets en esta categoría
          </p>
          <p
            className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-indigo-700'
            }`}
          >
            ¡Crea un nuevo ticket para comenzar!
          </p>
        </div>
      )}
    </div>
  );
}
