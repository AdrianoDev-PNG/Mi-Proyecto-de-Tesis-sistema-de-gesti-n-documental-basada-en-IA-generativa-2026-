// /src/app/context/Toast.tsx
"use client";

import { CheckCircle, XCircle, X } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export default function Toast({ type, message, onClose }: ToastProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`fixed top-20 right-4 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 min-w-[300px] max-w-md pointer-events-auto ${
        type === "success"
          ? theme === "dark"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            : "bg-emerald-50 border-emerald-200/50 text-emerald-700"
          : theme === "dark"
          ? "bg-red-500/10 border-red-500/30 text-red-200"
          : "bg-red-50 border-red-200/50 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`p-1 rounded-lg transition-colors ${
          theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
