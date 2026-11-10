// components/BulkDownload.tsx
"use client";

import { useState } from 'react';
import { Download, FileArchive, Loader2, CheckCircle2 } from 'lucide-react';
import { documentService } from '../../services/documents.service';

interface BulkDownloadProps {
  documentIds: string[];
  theme: 'light' | 'dark';
}

export default function BulkDownload({ documentIds, theme }: BulkDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'zip' | 'rar'>('zip');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (documentIds.length === 0) {
      setError('No hay documentos para descargar');
      return;
    }

    setIsDownloading(true);
    setError('');
    setDownloadSuccess(false);

    try {
      await documentService.downloadAndSave(
        documentIds,
        selectedFormat,
        `documentos_${new Date().getTime()}`
      );

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={`mt-4 p-4 rounded-xl border-2 transition-all ${
        theme === 'dark'
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FileArchive
            className={`w-5 h-5 ${
              theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'
            }`}
          />
          <div>
            <h3
              className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Descarga Masiva
            </h3>
            <p
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {documentIds.length} documento{documentIds.length !== 1 ? 's' : ''}{' '}
              seleccionado{documentIds.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de formato */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFormat('zip')}
              disabled={isDownloading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFormat === 'zip'
                  ? theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-blue-600 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ZIP
            </button>
            <button
              onClick={() => setSelectedFormat('rar')}
              disabled={isDownloading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFormat === 'rar'
                  ? theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-blue-600 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              RAR
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading || documentIds.length === 0}
            className={`px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Descargando...
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ¡Descargado!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
            theme === 'dark'
              ? 'bg-red-900/30 border border-red-800 text-red-200'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {downloadSuccess && (
        <div
          className={`mt-3 p-3 rounded-lg flex items-center gap-2 animate-fade-in ${
            theme === 'dark'
              ? 'bg-green-900/30 border border-green-800 text-green-200'
              : 'bg-green-100 border border-green-300 text-green-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            Descarga completada exitosamente
          </span>
        </div>
      )}
    </div>
  );
}