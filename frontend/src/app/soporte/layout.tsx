// src/app/soporte/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { getAccessToken, getUser, clearAuthData } from "../services/auth.service";
import { LogOut, Sun, Moon } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  full_name?: string;
  email: string;
  role: "soporte" | "administrador" | "usuario";
}

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  description: string;
}

function SoporteLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAccessToken();
      const currentUser = getUser() as UserData | null;

      if (!token || !currentUser) {
        setLoading(false);
        router.push("/");
        return;
      }

      if (currentUser.role !== "soporte" && currentUser.role !== "administrador") {
        setLoading(false);
        router.push("/user");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    clearAuthData();
    router.push("/");
  };

  const menuItems: MenuItem[] = [
    { path: "/soporte", icon: "📊", label: "Dashboard", description: "Vista general" },
    { path: "/soporte/tickets", icon: "📋", label: "Tickets Disponibles", description: "Sin asignar" },
    { path: "/soporte/mis-tickets", icon: "💼", label: "Mis Tickets", description: "Asignados a mí" },
  ];

  if (loading || !user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-16 h-16 border-4 rounded-full animate-spin ${
              theme === "dark"
                ? "border-slate-700 border-t-indigo-500"
                : "border-gray-200 border-t-indigo-600"
            }`}
          />
          <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
            Cargando panel de soporte...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark"
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
    }`}>
      <header
        className={`fixed top-0 left-0 right-0 h-16 z-50 border-b backdrop-blur-md transition-all duration-300 ${
          theme === "dark"
            ? "bg-slate-800/95 border-slate-700"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              S
            </div>
            <div>
              <h1
                className={`text-xl font-bold transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Centro de Soporte
              </h1>
              <p
                className={`text-xs transition-colors duration-300 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Panel de Agente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                theme === "dark"
                  ? "hover:bg-slate-700 text-slate-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <div
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                theme === "dark" ? "bg-slate-700/50" : "bg-gray-100"
              }`}
            >
              <p
                className={`font-semibold text-sm transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {user.full_name || user.username}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                theme === "dark"
                  ? "hover:bg-red-500/20 text-red-400"
                  : "hover:bg-red-50 text-red-600"
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] transition-all duration-300 z-40 ${
            sidebarOpen ? "w-64" : "w-20"
          } ${
            theme === "dark"
              ? "bg-slate-800/95 border-r border-slate-700"
              : "bg-white/95 border-r border-gray-200"
          } backdrop-blur-sm`}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              theme === "dark"
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {sidebarOpen ? "←" : "→"}
          </button>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? theme === "dark"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                        : "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : theme === "dark"
                      ? "text-gray-300 hover:bg-slate-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {sidebarOpen && (
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div
                        className={`text-xs ${
                          isActive
                            ? "text-white/80"
                            : theme === "dark"
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SoporteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SoporteLayoutContent>{children}</SoporteLayoutContent>
    </ThemeProvider>
  );
}