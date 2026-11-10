'use client';

import { SupportTicket } from '@/app/user/types/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketsTableProps {
  tickets: SupportTicket[];
  onTicketClick: (ticket: SupportTicket) => void;
  loading?: boolean;
  theme: 'light' | 'dark';
}

export function TicketsTable({ tickets, onTicketClick, loading = false, theme }: TicketsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-lg">📭 No hay tickets</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className={`border-b-2 ${theme === 'dark' ? 'border-slate-600 bg-slate-700/50' : 'border-blue-200 bg-blue-100'}`}>
          <tr>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-indigo-900'}`}>
              Asunto
            </th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-indigo-900'}`}>
              Prioridad
            </th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-indigo-900'}`}>
              Estado
            </th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-indigo-900'}`}>
              Creado
            </th>
            <th className={`px-6 py-4 text-center text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-indigo-900'}`}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{borderColor: theme === 'dark' ? '#334155' : '#e0e7ff'}}>
          {tickets.map(ticket => {
            const priorityColors = {
              low: theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800',
              medium: theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
              high: theme === 'dark' ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-800',
              critical: theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800',
            };

            const statusColors = {
              open: theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800',
              in_progress: theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800',
              resolved: theme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800',
              closed: theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800',
            };

            return (
              <tr
                key={ticket.id}
                className={`hover:bg-opacity-50 transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-blue-50'}`}
              >
                <td className={`px-6 py-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <div className="font-medium truncate">{ticket.subject}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {ticket.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[ticket.priority]}`}>
                    {ticket.priority === 'low' && '🟢 Baja'}
                    {ticket.priority === 'medium' && '🟡 Media'}
                    {ticket.priority === 'high' && '🟠 Alta'}
                    {ticket.priority === 'critical' && '🔴 Crítica'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[ticket.status]}`}>
                    {ticket.status === 'open' && '✅ Abierto'}
                    {ticket.status === 'in_progress' && '🔄 Progreso'}
                    {ticket.status === 'resolved' && '✓ Resuelto'}
                    {ticket.status === 'closed' && '🔒 Cerrado'}
                  </span>
                </td>
                <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: es })}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onTicketClick(ticket)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors"
                  >
                    Ver →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
