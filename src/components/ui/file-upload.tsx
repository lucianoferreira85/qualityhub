"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  tenantSlug: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  existingUrl?: string | null;
  existingFileName?: string | null;
  onUpload: (result: { path: string; url: string; fileName: string }) => void;
  onRemove?: () => void;
}

export function FileUpload({
  tenantSlug,
  folder = "documents",
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.txt",
  maxSizeMB = 10,
  existingUrl,
  existingFileName,
  onUpload,
  onRemove,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    url: string;
  } | null>(
    existingUrl && existingFileName
      ? { fileName: existingFileName, url: existingUrl }
      : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo excede o tamanho maximo de ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch(`/api/tenants/${tenantSlug}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao fazer upload");
        }

        const { data } = await res.json();
        setUploadedFile({ fileName: data.fileName, url: data.path });
        onUpload(data);
        toast.success("Arquivo enviado com sucesso");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro no upload";
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [tenantSlug, folder, maxSizeMB, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleRemove = () => {
    setUploadedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  if (uploadedFile) {
    const viewUrl = uploadedFile.url.startsWith("http")
      ? uploadedFile.url
      : `/api/tenants/${tenantSlug}/files/${uploadedFile.url}`;

    return (
      <div className="flex items-center gap-3 p-3 rounded-card border border-stroke-secondary bg-surface-secondary shadow-xs">
        <div className="h-9 w-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-2 text-foreground-primary truncate font-medium">
            {uploadedFile.fileName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {uploadedFile.url && (
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption-1 text-brand hover:text-brand-hover transition-colors duration-120 font-medium"
            >
              Visualizar
            </a>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="h-7 w-7 flex items-center justify-center rounded-button text-foreground-tertiary hover:text-danger hover:bg-danger-bg transition-all duration-120"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 p-8 rounded-card border-2 border-dashed cursor-pointer transition-all duration-200 ${
        dragOver
          ? "border-brand bg-brand-subtle scale-[1.01]"
          : "border-stroke-secondary hover:border-brand/40 hover:bg-surface-secondary"
      }`}
    >
      {uploading ? (
        <div className="h-12 w-12 rounded-xl bg-brand-light flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-brand animate-spin" />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-xl bg-surface-tertiary flex items-center justify-center">
          <Upload className="h-6 w-6 text-foreground-tertiary" />
        </div>
      )}
      <p className="text-body-2 text-foreground-secondary text-center">
        {uploading
          ? "Enviando arquivo..."
          : "Arraste um arquivo ou clique para selecionar"}
      </p>
      <p className="text-caption-2 text-foreground-tertiary">
        Max. {maxSizeMB}MB — PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
