import { useTheme } from "../../../context/ThemeContext";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const InfoCard = ({ title, children, className = "" }: InfoCardProps) => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`p-5 rounded-xl border-2 transition-all ${
        theme === "dark"
          ? "bg-slate-700/30 border-slate-600 hover:bg-slate-700/50"
          : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-md"
      } ${className}`}
    >
      <h3 className={`font-bold text-lg mb-4 pb-2 border-b ${
        theme === "dark" ? "border-slate-600 text-indigo-300" : "border-slate-300 text-indigo-700"
      }`}>
        {title}
      </h3>
      {children}
    </div>
  );
};

interface DataRowProps {
  label: string;
  value: string | number | undefined;
  mono?: boolean;
}

export const DataRow = ({ label, value, mono = false }: DataRowProps) => {
  const { theme } = useTheme();
  
  if (!value) return null;
  
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
      <span className={`font-semibold text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
        {label}:
      </span>
      <span className={`text-right ml-4 ${mono ? "font-mono text-xs" : "text-sm"} ${
        theme === "dark" ? "text-slate-200" : "text-slate-800"
      }`}>
        {value}
      </span>
    </div>
  );
};

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Cargando detalles del documento..." }: LoadingSpinnerProps) => {
  const { theme } = useTheme();
  
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      <p className={`mt-4 text-lg ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
        {message}
      </p>
    </div>
  );
};

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert = ({ message }: ErrorAlertProps) => {
  return (
    <div className="p-4 rounded-xl bg-red-100 text-red-800 border-2 border-red-300 flex items-center gap-3">
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
};

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader = ({ onClose }: ModalHeaderProps) => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-md ${
        theme === "dark"
          ? "border-slate-700 bg-slate-800/95"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Detalles del Documento
        </h2>
        <p className={`text-sm mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
          Información completa y análisis
        </p>
      </div>
      <button
        onClick={onClose}
        className={`p-3 rounded-xl transition-all hover:rotate-90 ${
          theme === "dark"
            ? "hover:bg-slate-700 text-slate-400 hover:text-white"
            : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Utility functions
export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (typeof value === 'number' && value === 0) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && Object.keys(value).length === 0) return false;
  return true;
};