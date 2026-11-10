"use client";

import { useRouter } from "next/navigation";
import { Shield, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { clearAuthData } from "@/app/services/auth.service";

export default function AdminHeader() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    clearAuthData();
    router.push("/");
  };

  return (
    <header
      className={`backdrop-blur-xl border-b sticky top-0 z-50 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-white/5 border-white/10"
          : "bg-white/80 border-blue-200/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                theme === "dark"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-xl font-bold transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Panel Administrativo
              </h1>
              <p
                className={`text-xs transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Gestión de usuarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                theme === "dark"
                  ? "hover:bg-white/10 text-slate-400 hover:text-white"
                  : "hover:bg-blue-100 text-slate-600 hover:text-blue-600"
              }`}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-colors duration-300 group ${
                theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-100"
              }`}
              title="Cerrar sesión"
            >
              <LogOut
                className={`w-5 h-5 group-hover:text-red-400 transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}