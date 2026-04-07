"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type FinalDesignUploadModalProps = {
  isOpen: boolean;
  taskLabel: string;
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
};

export function FinalDesignUploadModal({
  isOpen,
  taskLabel,
  isSaving,
  onClose,
  onConfirm,
}: FinalDesignUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEscapeClose(isOpen, onClose);
  useFocusTrap(isOpen, modalRef);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Solo permitir ciertos tipos de archivo
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Solo se permiten archivos PDF, PNG o JPG");
      return;
    }

    // Limitar tamaño a 50MB
    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo no puede exceder 50MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedFile) {
      setError("Por favor selecciona un archivo para subir");
      return;
    }

    try {
      await onConfirm(selectedFile);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
      setSelectedFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
          Carga del diseño final
        </p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900">Subir diseño final</h3>
        <p className="mt-2 text-sm text-secondary">Proyecto: {taskLabel}</p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900">Diseño final cargado correctamente</p>
              <p className="text-xs text-emerald-700 mt-1">La tarea se moverá a cotización formal...</p>
            </div>
          </div>
        ) : (
          <>
            {/* File Input Area */}
            <div
              className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedFile ? selectedFile.name : "Selecciona o arrastra un archivo"}
                  </p>
                  <p className="text-xs text-secondary mt-1">PDF, PNG o JPG (máx 50MB)</p>
                </div>
              </div>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs text-secondary">
                <p className="font-semibold text-gray-700">Archivo seleccionado:</p>
                <p className="mt-1">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-rose-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!selectedFile || isSaving}
                className="rounded-2xl bg-primary px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? "Subiendo..." : "Cargar diseño final"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
