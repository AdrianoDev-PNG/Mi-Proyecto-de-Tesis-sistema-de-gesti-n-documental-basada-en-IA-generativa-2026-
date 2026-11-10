// components/ConfirmationModal.tsx
"use client";
import React, { useState } from "react";
import { X, AlertTriangle, Trash2, LucideIcon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (additionalData?: boolean) => void;
  title?: string;
  subtitle?: string;
  message?: string;
  itemCount?: number;
  itemLabel?: string;
  isLoading?: boolean;
  icon?: LucideIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: "danger" | "primary" | "warning";
  showAdditionalCheckbox?: boolean;
  checkboxLabel?: string;
  checkboxDescription?: string;
  checkedByDefault?: boolean;
  itemsList?: string[];
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Eliminación",
  subtitle = "Esta acción no se puede deshacer",
  message = "Estás a punto de eliminar",
  itemCount = 1,
  itemLabel = "elemento",
  isLoading = false,
  icon: IconComponent = AlertTriangle,
  confirmButtonText = "Eliminar",
  cancelButtonText = "Cancelar",
  confirmButtonVariant = "danger",
  showAdditionalCheckbox = false,
  checkboxLabel = "Opción adicional",
  checkboxDescription = "Selecciona esta opción",
  checkedByDefault = true,
  itemsList = ["Los registros de la base de datos", "Todos los metadatos asociados"]
}: ConfirmationModalProps) {
  const { theme } = useTheme();
  const [additionalOption, setAdditionalOption] = useState(checkedByDefault);

  if (!isOpen) return null;

  const borderColor = confirmButtonVariant === "danger" ? "border-red-500/30" : "border-blue-500/30";
  const borderBg = confirmButtonVariant === "danger" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200";
  const borderDarkBg = confirmButtonVariant === "danger" ? "bg-red-500/10 border-red-500/30" : "bg-blue-500/10 border-blue-500/30";
  const textColor = confirmButtonVariant === "danger" ? "text-red-200" : "text-blue-200";
  const darkTextColor = confirmButtonVariant === "danger" ? "text-red-800" : "text-blue-800";

  const buttonBaseColor = {
    danger: "bg-red-600 hover:bg-red-700",
    primary: "bg-blue-600 hover:bg-blue-700",
    warning: "bg-amber-600 hover:bg-amber-700"
  }[confirmButtonVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border transition-colors duration-300 ${
          theme === "dark"
            ? `bg-slate-800 ${borderColor}`
            : "bg-white border-gray-200"
        }`}
      >
        <div
          className={`p-6 border-b ${
            theme === "dark" ? "border-white/10" : "border-gray-200/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                confirmButtonVariant === "danger"
                  ? "bg-red-500/20"
                  : confirmButtonVariant === "warning"
                  ? "bg-amber-500/20"
                  : "bg-blue-500/20"
              }`}>
                <IconComponent className={`w-6 h-6 ${
                  confirmButtonVariant === "danger"
                    ? "text-red-500"
                    : confirmButtonVariant === "warning"
                    ? "text-amber-500"
                    : "text-blue-500"
                }`} />
              </div>
              <div>
                <h2
                  className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {title}
                </h2>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-white/10 text-slate-400"
                  : "hover:bg-slate-100 text-slate-600"
              } disabled:opacity-50`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              theme === "dark" ? borderDarkBg : borderBg
            }`}
          >
            <p
              className={`text-sm font-medium ${
                theme === "dark" ? textColor : darkTextColor
              }`}
            >
              {message}{" "}
              {itemCount && (
                <span className="font-bold">
                  {itemCount} {itemCount === 1 ? itemLabel : itemLabel + "s"}
                </span>
              )}
            </p>
          </div>

          {itemsList.length > 0 && (
            <div className="space-y-3">
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Esta acción eliminará:
              </p>
              <ul
                className={`space-y-2 text-sm ${
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {itemsList.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      confirmButtonVariant === "danger"
                        ? "bg-red-500"
                        : confirmButtonVariant === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showAdditionalCheckbox && (
            <label
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                theme === "dark"
                  ? "border-white/10 hover:bg-white/5"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={additionalOption}
                onChange={(e) => setAdditionalOption(e.target.checked)}
                disabled={isLoading}
                className={`w-4 h-4 rounded border-slate-300 ${
                  confirmButtonVariant === "danger"
                    ? "text-red-600"
                    : confirmButtonVariant === "warning"
                    ? "text-amber-600"
                    : "text-blue-600"
                } focus:ring-offset-0`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {checkboxLabel}
                </p>
                <p
                  className={`text-xs ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {checkboxDescription}
                </p>
              </div>
            </label>
          )}
        </div>
        <div
          className={`p-6 border-t flex gap-3 ${
            theme === "dark" ? "border-white/10" : "border-slate-200"
          }`}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              theme === "dark"
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            } disabled:opacity-50`}
          >
            {cancelButtonText}
          </button>

          <button
            onClick={() => onConfirm(additionalOption)}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${buttonBaseColor} text-white disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {confirmButtonText}...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {confirmButtonText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}