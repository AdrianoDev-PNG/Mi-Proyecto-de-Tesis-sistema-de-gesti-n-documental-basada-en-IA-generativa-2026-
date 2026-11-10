"use client";

import { Upload } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useRef } from "react";

interface UploadSectionProps {
  isUploading: boolean;
  uploadProgress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadSection({
  isUploading,
  uploadProgress,
  onFileChange,
}: UploadSectionProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl p-8 mb-8 shadow-2xl transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border-white/10"
          : "bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 border-blue-200/30"
      }`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2
            className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Subir nuevos documentos
          </h2>
          <p
            className={`transition-colors duration-300 ${
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Selecciona archivos PDF o DOCX para procesar
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`font-bold px-8 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 ${
              theme === "dark"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            }`}
          >
            <Upload className="w-5 h-5" />
            {isUploading ? "Subiendo..." : "Seleccionar archivos"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx"
            onChange={onFileChange}
            className="hidden"
          />

          {isUploading && (
            <div className="w-64">
              <div
                className={`rounded-full h-2 overflow-hidden ${
                  theme === "dark" ? "bg-white/20" : "bg-blue-200"
                }`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-indigo-400 to-cyan-400"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500"
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p
                className={`text-sm text-center mt-2 font-semibold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}