"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { DocumentDetail as DocumentDetailType } from "../../types/types";
import { documentService } from "../../services/documents.service";
import {
  InfoCard,
  DataRow,
  LoadingSpinner,
  ErrorAlert,
  ModalHeader,
  getStatusColor,
  formatDate,
  formatFileSize,
  hasValue,
} from "./DocumentDetailComponents";

interface DocumentDetailProps {
  onClose: () => void;
  documentId: string;
}

export default function DocumentDetail({ onClose, documentId }: DocumentDetailProps) {
  const { theme } = useTheme();
  const [document, setDocument] = useState<DocumentDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setError("");
      setDocument(null);

      try {
        const response = await documentService.getDetail(documentId);
        setDocument(response.document);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al obtener detalles del documento"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  const getSummaryText = (summary: DocumentDetailType['summary']) => {
    if (!summary) return null;
    if (typeof summary === 'string') return summary;
    return summary.summary;
  };

  const renderEntityValue = (value: unknown, index: number) => {
    if (typeof value === 'object' && value !== null && 'date' in value && 'description' in value) {
      const dateObj = value as { date: string; description: string };
      return (
        <div
          key={index}
          className={`p-2 text-xs rounded border ${
            theme === "dark" 
              ? "bg-slate-700 border-slate-600 text-slate-300" 
              : "bg-slate-100 border-slate-200 text-slate-700"
          }`}
        >
          <div className="font-semibold">{dateObj.date}</div>
          <div className="text-xs opacity-80">{dateObj.description}</div>
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null && 'amount' in value) {
      const amountObj = value as { amount: number; currency: string; concept: string };
      return (
        <div
          key={index}
          className={`p-2 text-xs rounded border ${
            theme === "dark" 
              ? "bg-slate-700 border-slate-600 text-slate-300" 
              : "bg-slate-100 border-slate-200 text-slate-700"
          }`}
        >
          <div className="font-semibold">
            {amountObj.currency} {amountObj.amount.toFixed(2)}
          </div>
          <div className="text-xs opacity-80">{amountObj.concept}</div>
        </div>
      );
    }
    
    if (typeof value === 'string') {
      return (
        <span
          key={index}
          className={`px-2 py-1 text-xs rounded border ${
            theme === "dark" 
              ? "bg-slate-700 border-slate-600 text-slate-300" 
              : "bg-slate-100 border-slate-200 text-slate-700"
          }`}
        >
          {value}
        </span>
      );
    }
    
    return (
      <span
        key={index}
        className={`px-2 py-1 text-xs rounded border ${
          theme === "dark" 
            ? "bg-slate-700 border-slate-600 text-slate-300" 
            : "bg-slate-100 border-slate-200 text-slate-700"
        }`}
      >
        {String(value)}
      </span>
    );
  };

  const renderMetadataValue = (key: string, value: unknown) => {
    if (!hasValue(value)) return null;
    
    if (key === 'skills' && Array.isArray(value)) {
      return (
        <div key={key} className="col-span-full">
          <span className={`font-semibold text-sm block mb-2 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            Competencias:
          </span>
          <div className="flex flex-wrap gap-2">
            {value.map((skill, idx) => (
              <span key={idx} className={`px-3 py-1 rounded text-xs ${
                theme === "dark" ? "bg-indigo-700 text-indigo-200" : "bg-indigo-100 text-indigo-800"
              }`}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'languages' && Array.isArray(value)) {
      return (
        <div key={key} className="col-span-full">
          <span className={`font-semibold text-sm block mb-2 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            Idiomas:
          </span>
          <div className="flex flex-wrap gap-2">
            {value.map((lang, idx) => (
              <span key={idx} className={`px-3 py-1 rounded text-xs ${
                theme === "dark" ? "bg-green-700 text-green-200" : "bg-green-100 text-green-800"
              }`}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'detected_fields' && Array.isArray(value)) {
      return null;
    }

    const labelMap: Record<string, string> = {
      age: 'Edad',
      candidate_name: 'Nombre',
      years_experience: 'Experiencia (años)',
      current_position: 'Cargo Actual',
      current_company: 'Organización Actual',
      education_level: 'Nivel de Educación',
      document_type: 'Tipo',
      document_subtype: 'Subtipo',
      confidence_type: 'Nivel de Confianza',
      ruc: 'RUC',
      issuer: 'Emisor',
      receiver: 'Receptor',
      date: 'Fecha',
      currency: 'Moneda',
      total_amount: 'Monto Total',
      invoice_number: 'N° Documento',
      due_date: 'Vencimiento',
      expiration_date: 'Fecha de Expiración',
      issue_date: 'Fecha de Emisión',
      project_code: 'Código de Proyecto',
      contract_number: 'N° Contrato',
      reference_number: 'N° Referencia',
      issuer_address: 'Dirección Emisor',
      receiver_address: 'Dirección Receptor',
      contract_parties: 'Partes Contratantes',
      contract_duration: 'Duración del Contrato',
      contract_value: 'Valor del Contrato',
      legal_representative: 'Representante Legal',
      policy_number: 'N° Póliza',
      coverage_amount: 'Monto de Cobertura',
      beneficiary: 'Beneficiario',
      diagnosis: 'Diagnóstico',
      treatment: 'Tratamiento',
      doctor_name: 'Nombre del Médico',
    };

    const label = labelMap[key] || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    if (key === 'confidence_type' && typeof value === 'number') {
      return <DataRow key={key} label={label} value={`${Math.round(value * 100)}%`} />;
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="col-span-full">
          <span className={`font-semibold text-sm block mb-2 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            {label}:
          </span>
          <div className="flex flex-wrap gap-2">
            {value.map((item, idx) => (
              <span key={idx} className={`px-3 py-1 rounded text-xs ${
                theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"
              }`}>
                {String(item)}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return <DataRow key={key} label={label} value={String(value)} mono={key.includes('ruc') || key.includes('number') || key.includes('hash') || key.includes('id')} />;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 backdrop-blur-sm ${
        theme === "dark" ? "bg-black/60" : "bg-black/40"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl transition-all duration-300 ${
          theme === "dark"
            ? "bg-slate-800 text-slate-100"
            : "bg-white text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader onClose={onClose} />

        <div className="p-6 space-y-6">
          {error && <ErrorAlert message={error} />}
          {loading && <LoadingSpinner />}

          {document && !loading && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <InfoCard title="Archivo" className="lg:col-span-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate">{document.filename}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {document.file_type?.toUpperCase()} {document.file_size && `• ${formatFileSize(document.file_size)}`}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DataRow label="Páginas" value={document.page_count} />
                      <DataRow label="Palabras" value={document.word_count} />
                      <DataRow label="Usuario" value={document.username} />
                      <DataRow label="Email" value={document.email} />
                    </div>
                  </div>
                </InfoCard>

                <InfoCard title="Estado">
                  <div className="space-y-4">
                    <div className="text-center py-3">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(document.state)}`}>
                        {document.state.toUpperCase()}
                      </span>
                    </div>
                    <DataRow label="Subido" value={formatDate(document.upload_date)} />
                    {document.processed_at && (
                      <DataRow label="Procesado" value={formatDate(document.processed_at)} />
                    )}
                    {document.batch_status && (
                      <DataRow label="Lote" value={document.batch_status.toUpperCase()} />
                    )}
                  </div>
                </InfoCard>
              </div>

              {hasValue(getSummaryText(document.summary)) && (
                <InfoCard title="Resumen">
                  <p className={`text-base leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    {getSummaryText(document.summary)}
                  </p>
                </InfoCard>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {hasValue(document.total_amount) && (
                  <InfoCard title="Información Financiera">
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Monto Total</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {document.currency}{" "}
                          {Number(document.total_amount).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {document.metadata?.invoice_number && (
                        <DataRow label="N° Factura" value={String(document.metadata.invoice_number)} mono />
                      )}
                    </div>
                  </InfoCard>
                )}

                {document.metadata && Object.keys(document.metadata).length > 0 && (
                  <InfoCard title="Metadatos del Documento">
                    <div className="space-y-2">
                      {Object.entries(document.metadata).map(([key, value]) => renderMetadataValue(key, value))}
                    </div>
                  </InfoCard>
                )}
              </div>

              {document.visual_features && Object.values(document.visual_features).some(v => hasValue(v)) && (
                <InfoCard title="Características Visuales">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DataRow label="Calidad" value={document.visual_features.document_quality} />
                    <DataRow label="Claridad Texto" value={document.visual_features.text_clarity} />
                    <DataRow label="Complejidad" value={document.visual_features.visual_complexity} />
                    {document.visual_features.has_watermark && <DataRow label="Marca de Agua" value="Sí" />}
                    {document.visual_features.has_handwriting && <DataRow label="Escritura Manual" value="Sí" />}
                    {hasValue(document.visual_features.predominant_colors) && document.visual_features.predominant_colors && (
                      <div className="col-span-full">
                        <span className={`font-semibold text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          Colores Predominantes:
                        </span>
                        <div className="flex gap-2 mt-2">
                          {document.visual_features.predominant_colors.map((color, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded text-xs ${
                              theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"
                            }`}>
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}

              {document.detected_objects && document.detected_objects.length > 0 && (
                <InfoCard title="Objetos Detectados">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {document.detected_objects.map((obj, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        theme === "dark" ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm capitalize">{obj.type}</span>
                          {obj.confidence && (
                            <span className="text-xs text-slate-500">
                              {Math.round(obj.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {obj.location && <div>Ubicación: {obj.location}</div>}
                          {obj.details && Object.entries(obj.details).map(([key, value]) => (
                            <div key={key}>{key}: {String(value)}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}

              {document.layout_analysis && Object.values(document.layout_analysis).some(v => hasValue(v)) && (
                <InfoCard title="Análisis de Estructura">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DataRow label="Tipo Estructura" value={document.layout_analysis.document_structure} />
                    <DataRow label="Orientación" value={document.layout_analysis.page_orientation} />
                    <DataRow label="Complejidad" value={document.layout_analysis.complexity} />
                    {hasValue(document.layout_analysis.sections) && document.layout_analysis.sections && (
                      <div className="col-span-full">
                        <span className={`font-semibold text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          Secciones:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {document.layout_analysis.sections.map((section, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded text-xs ${
                              theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"
                            }`}>
                              {section}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}

              {document.authenticity_check && Object.values(document.authenticity_check).some(v => hasValue(v)) && (
                <InfoCard title="Verificación de Autenticidad">
                  <div className="space-y-3">
                    {hasValue(document.authenticity_check.confidence_score) && document.authenticity_check.confidence_score !== undefined && (
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Nivel de Confianza</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(document.authenticity_check.confidence_score * 100)}%
                        </p>
                      </div>
                    )}
                    <DataRow label="Firma" value={document.authenticity_check.signature_type} />
                    {document.authenticity_check.has_official_stamp && <DataRow label="Sello Oficial" value="Sí" />}
                    {document.authenticity_check.professional_appearance && <DataRow label="Aspecto Profesional" value="Sí" />}
                    {hasValue(document.authenticity_check.notes) && (
                      <div className={`p-3 rounded text-sm ${
                        theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"
                      }`}>
                        {document.authenticity_check.notes}
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}

              {document.entities && Object.entries(document.entities).some(([, values]) => hasValue(values)) && (
                <InfoCard title="Entidades Extraídas">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(document.entities).map(([key, values]) => {
                      if (!hasValue(values)) return null;
                      return (
                        <div key={key} className={`p-3 rounded-lg border ${theme === "dark" ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}>
                          <h4 className="font-semibold text-sm uppercase mb-2 text-indigo-500">{key}</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(values) && values.map((val, idx) => renderEntityValue(val, idx))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </InfoCard>
              )}

              {document.items && document.items.length > 0 && (
                <InfoCard title="Productos/Servicios">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b-2 ${theme === "dark" ? "border-slate-600" : "border-slate-300"}`}>
                          <th className="text-left p-3 font-bold">Descripción</th>
                          <th className="text-center p-3 font-bold">Tipo</th>
                          <th className="text-center p-3 font-bold">Cant.</th>
                          <th className="text-right p-3 font-bold">P. Unit.</th>
                          <th className="text-right p-3 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {document.items.map((item, index) => (
                          <tr
                            key={`${item.name}-${index}`}
                            className={`border-b ${theme === "dark" ? "border-slate-700" : "border-slate-200"} ${
                              index % 2 === 0 ? (theme === "dark" ? "bg-slate-800/30" : "bg-slate-50") : ""
                            }`}
                          >
                            <td className="p-3">
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-center p-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {item.type}
                              </span>
                            </td>
                            <td className="text-center p-3 font-mono">{item.quantity}</td>
                            <td className="text-right p-3 font-mono">
                              {item.currency} {item.unit_price.toFixed(2)}
                            </td>
                            <td className="text-right p-3 font-mono font-bold">
                              {item.currency} {item.total_price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </InfoCard>
              )}

              {document.tags && document.tags.length > 0 && (
                <InfoCard title="Etiquetas">
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((t, index) => (
                      <span
                        key={`${t.tag}-${index}`}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                          theme === "dark"
                            ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                        }`}
                      >
                        {t.tag} {t.confidence && <span className="opacity-70 text-xs ml-1">({Math.round(t.confidence * 100)}%)</span>}
                      </span>
                    ))}
                  </div>
                </InfoCard>
              )}

              {hasValue(document.extracted_text) && (
                <InfoCard title="Texto Completo Extraído">
                  <div className={`p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-xs whitespace-pre-wrap ${
                    theme === "dark" ? "bg-black/30 text-slate-300 border border-slate-700" : "bg-gray-50 text-slate-700 border border-slate-200"
                  }`}>
                    {document.extracted_text}
                  </div>
                </InfoCard>
              )}

              <InfoCard title="Detalles Técnicos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DataRow label="ID Documento" value={document.id} mono />
                  <DataRow label="ID Usuario" value={document.user_id} mono />
                  <DataRow label="Hash" value={document.file_hash ? document.file_hash.substring(0, 16) + "..." : undefined} mono />
                  <DataRow label="ID Lote" value={document.batch_id} mono />
                  <DataRow label="Idioma" value={document.language?.toUpperCase()} />
                </div>
              </InfoCard>

              {document.download_url && (
                <div className="flex justify-center pt-4">
                  <a
                    href={document.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar Documento
                  </a>
                </div>
              )}

              {document.error_message && (
                <div className="p-4 rounded-xl bg-red-100 text-red-800 border-2 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Mensaje de Error
                  </p>
                  <p className="ml-7">{document.error_message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}