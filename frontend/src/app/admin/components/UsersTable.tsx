"use client";

import { useState } from "react";
import { Users, Mail, Calendar, MoreVertical, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { User } from "../types/type";

interface UsersTableProps {
  users: User[];
  searchQuery: string;
  filterRole: string;
  filterStatus: string;
  onDelete?: (user: User) => void;
  onEdit?: (user: User) => void;
  onToggleStatus?: (userId: string) => void;
  loading?: string | null;
}

export default function UsersTable({
  users,
  searchQuery,
  filterRole,
  filterStatus,
  onDelete,
  onEdit,
  onToggleStatus,
  loading,
}: UsersTableProps) {
  const { theme } = useTheme();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesRole =
      filterRole === "all" ||
      filterRole === user.role;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.is_active) ||
      (filterStatus === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (filteredUsers.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users
          className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
            theme === "dark" ? "text-slate-600" : "text-slate-300"
          }`}
        />
        <p
          className={`text-lg transition-colors duration-300 ${
            theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          No hay usuarios para mostrar
        </p>
        <p
          className={`text-sm mt-1 transition-colors duration-300 text-slate-500`}
        >
          {searchQuery || filterRole !== "all" || filterStatus !== "all"
            ? "Intenta con otros filtros"
            : "Comienza creando el primer usuario"}
        </p>
      </div>
    );
  }

  return (
    <div 
      className="overflow-y-auto"
      style={{ 
        height: "calc(100vh - 550px)",
        minHeight: "400px",
        maxHeight: "600px"
      }}
    >
      <table className="w-full">
        <thead
          className={`sticky top-0 z-10 border-b transition-colors duration-300 ${
            theme === "dark"
              ? "bg-slate-800/95 border-white/10 backdrop-blur-sm"
              : "bg-blue-50/95 border-blue-200/50 backdrop-blur-sm"
          }`}
        >
          <tr>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Usuario
            </th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Email
            </th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Nombre Completo
            </th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Rol
            </th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Estado
            </th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Creado
            </th>
            <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Acciones
            </th>
          </tr>
        </thead>

        <tbody
          className={`divide-y transition-colors duration-300 ${
            theme === "dark" ? "divide-white/10" : "divide-blue-200/30"
          }`}
        >
          {filteredUsers.map((user) => (
            <tr
              key={user.id}
              className={`transition-colors duration-300 ${
                theme === "dark" ? "hover:bg-white/5" : "hover:bg-blue-100/50"
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}
                  >
                    {(user.username[0] || user.email[0]).toUpperCase()}
                  </div>
                  <span
                    className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {user.username}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className={`flex items-center gap-2 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                  <Mail className={`w-4 h-4 flex-shrink-0 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                  <span className="truncate">{user.email}</span>
                </div>
              </td>

              <td className={`px-6 py-4 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                {user.full_name || "-"}
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                    theme === "dark"
                      ? user.role === 'soporte'
                        ? "bg-orange-500/30 text-orange-200 border-orange-500/50"
                        : "bg-blue-500/30 text-blue-200 border-blue-500/50"
                      : user.role === 'soporte'
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}
                >
                  {user.role === 'soporte' ? '👨‍💼 Soporte' : '👤 Usuario'}
                </span>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit border whitespace-nowrap ${
                    theme === "dark"
                      ? user.is_active
                        ? "bg-emerald-500/30 text-emerald-200 border-emerald-500/50"
                        : "bg-amber-500/30 text-amber-200 border-amber-500/50"
                      : user.is_active
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      user.is_active
                        ? theme === "dark"
                          ? "bg-emerald-400"
                          : "bg-emerald-500"
                        : theme === "dark"
                        ? "bg-amber-400"
                        : "bg-amber-500"
                    }`}
                  />
                  {user.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className={`flex items-center gap-2 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                  <Calendar
                    className={`w-4 h-4 flex-shrink-0 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <span className="whitespace-nowrap">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("es-ES") : "-"}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "hover:bg-white/10 text-slate-400 hover:text-white"
                        : "hover:bg-blue-100 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === user.id && (
                    <div
                      className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-50 border ${
                        theme === "dark"
                          ? "bg-slate-800 border-slate-700"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <button
                        onClick={() => {
                          onEdit?.(user);
                          setOpenMenuId(null);
                        }}
                        disabled={loading === user.id}
                        className={`w-full px-4 py-2 text-left text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-50"
                            : "hover:bg-blue-50 text-slate-700 hover:text-slate-900 disabled:opacity-50"
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>

                      <button
                        onClick={() => {
                          onToggleStatus?.(user.id);
                          setOpenMenuId(null);
                        }}
                        disabled={loading === user.id}
                        className={`w-full px-4 py-2 text-left text-sm font-medium flex items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-50"
                            : "hover:bg-blue-50 text-slate-700 hover:text-slate-900 disabled:opacity-50"
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Deshabilitar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Habilitar
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onDelete?.(user);
                          setOpenMenuId(null);
                        }}
                        disabled={loading === user.id}
                        className={`w-full px-4 py-2 text-left text-sm font-medium rounded-b-lg flex items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50"
                            : "hover:bg-red-50 text-red-600 hover:text-red-700 disabled:opacity-50"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}