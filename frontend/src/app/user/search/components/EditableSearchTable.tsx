"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, Edit2, Save, X, Download, Plus, Trash2, Loader2 } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { IntelligentSearchResponse } from "../../types/types";
import { searchService } from "../../services/search.service";
import { getAccessToken } from "../../../services/auth.service";

interface EditableSearchTableProps {
  searchResults: IntelligentSearchResponse;
}

interface TableRow {
  id: string;
  filename: string;
  invoice_number: string;
  issuer: string;
  receiver: string;
  date: string;
  due_date: string;
  currency: string;
  total_amount: number;
  document_type: string;
  score: number;
  match_count: number;
  [key: string]: string | number;
}

interface Column {
  key: keyof TableRow;
  label: string;
  width: string;
  visible: boolean;
}

export default function EditableSearchTable({ searchResults }: EditableSearchTableProps) {
  const { theme } = useTheme();
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: keyof TableRow } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [columnEditValue, setColumnEditValue] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const [columns, setColumns] = useState<Column[]>([
    { key: "filename", label: "Archivo", width: "w-64", visible: true },
    { key: "invoice_number", label: "N° Factura", width: "w-32", visible: true },
    { key: "issuer", label: "Emisor", width: "w-48", visible: true },
    { key: "receiver", label: "Receptor", width: "w-48", visible: true },
    { key: "date", label: "Fecha", width: "w-28", visible: true },
    { key: "due_date", label: "Vencimiento", width: "w-32", visible: true },
    { key: "currency", label: "Moneda", width: "w-20", visible: true },
    { key: "total_amount", label: "Monto", width: "w-28", visible: true },
    { key: "document_type", label: "Tipo Doc", width: "w-28", visible: true },
    { key: "score", label: "Score", width: "w-20", visible: true },
    { key: "match_count", label: "Coincidencias", width: "w-32", visible: true },
  ]);

  useEffect(() => {
    const transformData = () => {
      const rows: TableRow[] = searchResults.results.map((result) => ({
        id: result.document.id,
        filename: result.document.filename || "Sin nombre",
        invoice_number: result.document.metadata?.invoice_number?.toString() || "N/A",
        issuer: result.document.metadata?.issuer?.toString() || "N/A",
        receiver: result.document.metadata?.receiver?.toString() || "N/A",
        date: result.document.metadata?.date?.toString() || "N/A",
        due_date: result.document.metadata?.due_date?.toString() || "N/A",
        currency: result.document.metadata?.currency?.toString() || "N/A",
        total_amount: typeof result.document.metadata?.total_amount === 'number' 
          ? result.document.metadata.total_amount 
          : parseFloat(String(result.document.metadata?.total_amount || 0)),
        document_type: result.document.document_type || result.document.metadata?.document_type?.toString() || "N/A",
        score: result.score,
        match_count: result.match_count,
      }));
      return rows;
    };

    const timeoutId = setTimeout(() => {
      setTableData(transformData());
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [searchResults]);

  const startEditing = (rowId: string, field: keyof TableRow) => {
    const row = tableData.find((r) => r.id === rowId);
    if (row) {
      setEditingCell({ rowId, field });
      setEditValue(String(row[field]));
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;

    setTableData((prev) =>
      prev.map((row) => {
        if (row.id === editingCell.rowId) {
          const field = editingCell.field;
          let value: string | number = editValue;

          if (field === "total_amount" || field === "score" || field === "match_count") {
            value = parseFloat(editValue) || 0;
          }

          return { ...row, [field]: value };
        }
        return row;
      })
    );

    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const addNewRow = () => {
    const newRow: TableRow = {
      id: `new-${Date.now()}`,
      filename: "Nuevo archivo",
      invoice_number: "",
      issuer: "",
      receiver: "",
      date: new Date().toISOString().split('T')[0],
      due_date: "",
      currency: "USD",
      total_amount: 0,
      document_type: "factura",
      score: 0,
      match_count: 0,
    };
    
    columns.forEach(col => {
      if (!(col.key in newRow)) {
        newRow[col.key] = "";
      }
    });
    
    setTableData([...tableData, newRow]);
  };

  const deleteRow = (rowId: string) => {
    setTableData(tableData.filter(row => row.id !== rowId));
  };

  const deleteColumn = (key: keyof TableRow) => {
    setColumns(columns.filter(col => col.key !== key));
  };

  const startEditingColumn = (key: keyof TableRow) => {
    const column = columns.find(col => col.key === key);
    if (column) {
      setEditingColumn(String(key));
      setColumnEditValue(column.label);
    }
  };

  const saveColumnEdit = () => {
    if (!editingColumn) return;

    setColumns(columns.map(col => 
      col.key === editingColumn ? { ...col, label: columnEditValue } : col
    ));

    setEditingColumn(null);
    setColumnEditValue("");
  };

  const cancelColumnEdit = () => {
    setEditingColumn(null);
    setColumnEditValue("");
  };

  const addNewColumn = () => {
    const newKey = `custom_${Date.now()}` as keyof TableRow;
    const newColumn: Column = {
      key: newKey,
      label: `Nueva Columna ${columns.length + 1}`,
      width: "w-32",
      visible: true,
    };
    setColumns([...columns, newColumn]);
    
    setTableData(tableData.map(row => ({
      ...row,
      [newKey]: ""
    })));
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("No estás autenticado");
      }

      const visibleColumns = columns.filter(col => col.visible);

      const exportData = tableData.map(row => {
        const rowData: { [key: string]: string | number } = {};
        visibleColumns.forEach(col => {
          rowData[col.key] = row[col.key];
        });
        return rowData;
      });

      const exportColumns = visibleColumns.map(col => ({
        key: String(col.key),
        label: col.label,
        width: col.width,
        visible: col.visible
      }));

      const blob = await searchService.exportSearchResults(
        exportData,
        exportColumns,
        searchResults.query,
        token
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `busqueda_resultados_${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exportando:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al exportar";
      setExportError(errorMessage);
      
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const visibleColumns = columns.filter(col => col.visible);

  if (tableData.length === 0) return null;

  return (
    <div
      className={`rounded-2xl shadow-lg overflow-hidden ${
        theme === "dark"
          ? "bg-slate-800 border border-slate-700"
          : "bg-white border border-gray-200"
      }`}
    >
      <div className="p-6 pb-4 border-b border-gray-300 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3
            className={`text-lg font-bold flex items-center gap-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            Tabla de Resultados Editable
          </h3>

          <div className="flex gap-2">
            <button
              onClick={addNewRow}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                theme === "dark"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              Nueva Fila
            </button>

            <button
              onClick={addNewColumn}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                theme === "dark"
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              Nueva Columna
            </button>

            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isExporting
                  ? "bg-gray-400 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar a Excel
                </>
              )}
            </button>
          </div>
        </div>

        {exportError && (
          <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {exportError}
          </div>
        )}

        <p
          className={`mt-4 text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Haz clic en cualquier celda para editarla antes de exportar
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead
              className={`sticky top-0 z-10 ${
                theme === "dark" ? "bg-slate-900" : "bg-gray-50"
              }`}
            >
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b w-20 ${
                    theme === "dark"
                      ? "text-gray-400 border-slate-700"
                      : "text-gray-600 border-gray-200"
                  }`}
                >
                  Acciones
                </th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b group ${
                      theme === "dark"
                        ? "text-gray-400 border-slate-700"
                        : "text-gray-600 border-gray-200"
                    } ${col.width}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {editingColumn === col.key ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={columnEditValue}
                            onChange={(e) => setColumnEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveColumnEdit();
                              if (e.key === "Escape") cancelColumnEdit();
                            }}
                            className={`flex-1 px-2 py-1 rounded border text-sm ${
                              theme === "dark"
                                ? "bg-slate-700 border-slate-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            autoFocus
                          />
                          <button
                            onClick={saveColumnEdit}
                            className="p-1 text-green-500 hover:text-green-600"
                            title="Guardar"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelColumnEdit}
                            className="p-1 text-red-500 hover:text-red-600"
                            title="Cancelar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span 
                            className="cursor-pointer hover:text-blue-500 transition-colors"
                            onClick={() => startEditingColumn(col.key)}
                            title="Clic para editar nombre"
                          >
                            {col.label}
                          </span>
                          <button
                            onClick={() => deleteColumn(col.key)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                            title="Eliminar columna"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className={`${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              }`}
            >
              {tableData.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors ${
                    theme === "dark"
                      ? "border-slate-700 hover:bg-slate-700/30"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="p-1 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {visibleColumns.map((col) => {
                    const isEditing =
                      editingCell?.rowId === row.id &&
                      editingCell?.field === col.key;

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className={`flex-1 px-2 py-1 rounded border ${
                                theme === "dark"
                                  ? "bg-slate-700 border-slate-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              className="p-1 text-green-500 hover:text-green-600"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-red-500 hover:text-red-600"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditing(row.id, col.key)}
                            className={`cursor-pointer rounded px-2 py-1 flex items-center justify-between group ${
                              theme === "dark"
                                ? "hover:bg-slate-600"
                                : "hover:bg-gray-200"
                            }`}
                          >
                            <span className="truncate">
                              {col.key === "total_amount"
                                ? row[col.key].toFixed(2)
                                : row[col.key]}
                            </span>
                            <Edit2
                              className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 ${
                                theme === "dark"
                                  ? "text-indigo-400"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={`p-4 border-t ${
          theme === "dark"
            ? "bg-slate-900/50 border-slate-700 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-600"
        }`}
      >
        <p className="text-sm text-center">
          Total de registros: <strong>{tableData.length}</strong> | Presiona{" "}
          <kbd
            className={`px-2 py-0.5 rounded text-xs font-mono ${
              theme === "dark" ? "bg-slate-700" : "bg-white border"
            }`}
          >
            Enter
          </kbd>{" "}
          para guardar o{" "}
          <kbd
            className={`px-2 py-0.5 rounded text-xs font-mono ${
              theme === "dark" ? "bg-slate-700" : "bg-white border"
            }`}
          >
            Esc
          </kbd>{" "}
          para cancelar
        </p>
      </div>
    </div>
  );
}