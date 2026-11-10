"use client";

import { useState } from "react";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { CreateUserRequest } from "../types/type";

interface CreateUserFormProps {
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  loading: boolean;
}

export default function CreateUserForm({ onSubmit, loading }: CreateUserFormProps) {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "usuario",
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
    await onSubmit(formData);
    setFormData({
      username: "",
      email: "",
      password: "",
      full_name: "",
      role: "usuario",
    });
    setShowPassword(false);
  };

  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl p-8 mb-8 shadow-2xl transition-colors duration-300 ${
        theme === "dark"
          ? "bg-white/5 border-white/10"
          : "bg-blue-50/50 border-blue-200/30"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-6 flex items-center gap-2 transition-colors duration-300 ${
          theme === "dark" ? "text-white" : "text-slate-900"
        }`}
      >
        <UserPlus
          className={`w-6 h-6 transition-colors duration-300 ${
            theme === "dark" ? "text-indigo-400" : "text-blue-600"
          }`}
        />
        Crear Nuevo Usuario
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Nombre de Usuario *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="usuario123"
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
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
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="usuario@ejemplo.com"
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
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
              Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
                className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  theme === "dark"
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
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
              placeholder="Juan Pérez"
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
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
              Rol *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
            theme === "dark"
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
              : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          }`}
        >
          <UserPlus className="w-5 h-5" />
          {loading ? "Creando..." : "Crear Usuario"}
        </button>
      </form>
    </div>
  );
}