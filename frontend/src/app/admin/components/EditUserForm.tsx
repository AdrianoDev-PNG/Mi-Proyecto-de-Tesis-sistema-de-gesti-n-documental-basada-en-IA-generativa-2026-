"use client";

import { useState } from "react";
import { Edit2, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { User } from "../types/type";

interface EditUserFormProps {
  user: User | null;
  onClose: () => void;
  onSubmit: (userId: string, data: { username?: string; email?: string; full_name?: string; role?: string }) => Promise<void>;
  loading: boolean;
}

export default function EditUserForm({ user, onClose, onSubmit, loading }: EditUserFormProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    full_name: user?.full_name || "",
    role: user?.role || "usuario",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      await onSubmit(user.id, formData);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border transition-colors duration-300 ${
          theme === "dark"
            ? "bg-slate-800 border-white/10"
            : "bg-white border-blue-200/30"
        }`}
      >
        <div
          className={`p-6 border-b flex items-center justify-between transition-colors duration-300 ${
            theme === "dark" ? "border-white/10" : "border-blue-200/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <Edit2 className={`w-6 h-6 ${theme === "dark" ? "text-indigo-400" : "text-blue-600"}`} />
            <h2
              className={`text-xl font-bold transition-colors duration-300 ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Editar Usuario
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "hover:bg-white/10 text-slate-400"
                : "hover:bg-blue-100 text-slate-600"
            } disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                  : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                  : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Nombre Completo
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                  : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Rol
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20"
                  : "bg-white border-blue-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
              style={
                theme === "dark"
                  ? {
                      colorScheme: "dark",
                      accentColor: "#818cf8",
                    }
                  : { colorScheme: "light" }
              }
            >
              <option value="usuario" style={theme === "dark" ? { backgroundColor: "#1f2937", color: "#fff" } : {}}>
                👤 Usuario
              </option>
              <option value="soporte" style={theme === "dark" ? { backgroundColor: "#1f2937", color: "#fff" } : {}}>
                👨‍💼 Soporte
              </option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all text-white disabled:opacity-50 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              }`}
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
