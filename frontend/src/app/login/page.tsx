"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, AlertCircle } from "lucide-react";
import { loginRequest, saveAuthData } from "@/app/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Por favor ingresa tu usuario y contraseña");
      setIsLoading(false);
      return;
    }

    try {
      const data = await loginRequest(username, password);

      if (data.success) {
        saveAuthData(data);
        console.log("Rol de usuario: ", data.user?.role);
        
        const rawRole = data.user?.role;
        const role = rawRole ? rawRole.toString().trim().toLowerCase() : null;

        if (!role) {
          setError("El usuario no tiene rol asignado");
          return;
        }
        switch (role) {
          case "administrador":
            router.push("/admin");
            return;
          case "usuario":
            router.push("/user");
            return;
          case "soporte":
            router.push("/soporte");
            return;
          default:
            setError(`Rol de usuario desconocido: ${rawRole}`);
            return;
        }
        return;
      }
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || "No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden flex relative z-10">
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            <div className="mb-8 transform hover:scale-110 transition-transform duration-300">
              <h1 className="text-7xl font-black mb-4 tracking-tight">J&P</h1>
              <div className="h-1 w-24 bg-white mx-auto mb-4"></div>
              <p className="text-xl font-medium tracking-widest">PERIFÉRICOS S.A.C</p>
            </div>
            <p className="text-blue-100 text-sm max-w-xs mx-auto leading-relaxed mt-8">
              Sistema de gestión documental inteligente para tu empresa
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="w-full lg:w-3/5 p-8 sm:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                J&P
              </h1>
              <p className="text-gray-600 mt-2 text-sm tracking-wide">PERIFÉRICOS S.A.C</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h2>
              <p className="text-gray-600">Ingresa tus credenciales para acceder</p>
            </div>

            <div className="space-y-6" onKeyPress={handleKeyPress}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all bg-gray-50 focus:bg-white text-black dark:text-black"
                    placeholder="Ingresa tu usuario"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all bg-gray-50 focus:bg-white text-black dark:text-black"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">¿Necesitas ayuda? Contacta al administrador del sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
