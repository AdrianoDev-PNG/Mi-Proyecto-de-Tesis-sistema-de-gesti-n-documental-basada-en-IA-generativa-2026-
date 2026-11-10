// user/layout.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { UserMeData } from "./types/types";
import { userService } from "./services/user.service";
import { getAccessToken, clearAuthData } from "../services/auth.service";
import UserHeader from "./components/Header";

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [user, setUser] = useState<UserMeData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const data = await userService.getMe();
        setUser(data.user);
      } catch (error) {
        console.error("Error cargando usuario:", error);
        clearAuthData();
        router.push("/");
      }
    };

    fetchUserData();
  }, [router]);

  const menuItems = [
    {
      path: "/user",
      icon: "📊",
      label: "Dashboard",
      description: "Vista de datos general"
    },
    {
      path: "/user/Docs",
      icon: "📄",
      label: "Documentos",
      description: "Lista de documentos"
    },
    {
      path: "/user/search",
      icon: "🔍",
      label: "Búsqueda",
      description: "Búsqueda inteligente"
    },
    {
      path: "/user/historial",
      icon: "🕐",
      label: "Historial",
      description: "Búsquedas anteriores"
    },
    {
      path: "/user/soporte",
      icon: "💬",
      label: "Soporte",
      description: "Centro de ayuda"
    }
  ];

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-16 w-16 border-t-4 ${
            theme === "dark" ? "border-indigo-500" : "border-blue-600"
          }`}
        ></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      }`}
    >
      <UserHeader user={user} />

      <div className="flex">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
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
                      <div className="font-medium">{item.label}</div>
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

                  {!sidebarOpen && isActive && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-indigo-600 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.label}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <UserLayoutContent>{children}</UserLayoutContent>
    </ThemeProvider>
  );
}