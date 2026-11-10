"use client";

import { Search, Filter } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterRole: string;
  setFilterRole: (role: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  totalUsers: number;
  filteredCount: number;
}

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  totalUsers,
  filteredCount,
}: SearchFiltersProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`p-6 border-b transition-colors duration-300 ${
        theme === "dark"
          ? "border-white/10 bg-gradient-to-r from-white/5 to-transparent"
          : "border-blue-200/30 bg-gradient-to-r from-blue-50/50 to-transparent"
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email o usuario..."
            className={`w-full pl-12 pr-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
            }`}
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-300 ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`pl-10 pr-4 py-3 border rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20 [&>option]:bg-slate-800 [&>option]:text-white"
                  : "bg-white border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 [&>option]:bg-white [&>option]:text-slate-900"
              }`}
            >
              <option value="all">Todos los roles</option>
              <option value="usuario">👤 Usuario</option>
              <option value="soporte">👨‍💼 Soporte</option>
            </select>
          </div>

          <div className="relative">
            <Filter
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-300 ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`pl-10 pr-4 py-3 border rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20 [&>option]:bg-slate-800 [&>option]:text-white"
                  : "bg-white border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 [&>option]:bg-white [&>option]:text-slate-900"
              }`}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className={`text-sm transition-colors duration-300 ${
          theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Mostrando{" "}
        <span
          className={`font-semibold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          {filteredCount}
        </span>{" "}
        de{" "}
        <span
          className={`font-semibold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          {totalUsers}
        </span>{" "}
        usuarios
      </div>
    </div>
  );
}