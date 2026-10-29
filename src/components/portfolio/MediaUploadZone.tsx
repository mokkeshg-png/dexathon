import { useState, useRef } from "react";
import { uploadMedia, isPdf } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { UploadCloud, X, FileText, Loader2, RefreshCw, Eye } from "lucide-react";

interface MediaUploadZoneProps {
  label?: string;
  hint?: string;
  userId: string;
  folder?: string;
  bucket?: "avatars" | "documents";
  value?: string;
  onChange: (url: string) => void;
  allowedTypes?: string[];
  maxSizeBytes?: number;
  onPreview?: (url: string, name?: string) => void;
  className?: string;
}

export function MediaUploadZone({
  label = "Upload Supporting Media",
  hint = "PNG, JPG, WebP or PDF up to 10MB",
  userId,
  folder = "portfolio",
  bucket = "documents",
  value,
  onChange,
  allowedTypes,
  maxSizeBytes,
  onPreview,
  className = "",
}: MediaUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await uploadMedia(file, userId, {
        bucket,
        folder,
        allowedTypes,
        maxSizeBytes,
      });
      onChange(res.url);
    } catch (err: any) {
      setError(err?.message || "Upload failed. Please try a different file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold text-ink-700">{label}</label>}

      {value ? (
        <div className="relative rounded-xl border border-ink-200 bg-paper-50 p-3 shadow-2xs transition-all">
          <div className="flex items-center gap-3">
            {isPdf(value) ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200 shadow-2xs">
                <FileText className="h-7 w-7" />
              </div>
            ) : (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-2xs">
                <img
                  src={value}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink truncate">
                {isPdf(value) ? "Verified PDF Document" : "Uploaded Media Asset"}
              </p>
              <p className="text-[11px] text-ink-400 truncate">
                {value.startsWith("data:") ? "Local preview asset" : value}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPreview(value)}
                  title="View fullscreen"
                  className="h-8 px-2 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1">Preview</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                title="Replace file"
                className="h-8 px-2 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1">Replace</span>
              </Button>

              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-navy bg-navy-50/50 scale-[1.01]"
              : "border-ink-200 hover:border-navy hover:bg-paper-50/70"
          } ${uploading ? "opacity-75 pointer-events-none" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-navy" />
              <p className="text-xs font-medium text-navy">Uploading & optimizing file...</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-paper-100 text-ink-500">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-ink-800">
                <span className="font-semibold text-navy hover:underline">Click to browse</span> or drag and drop
              </p>
              <p className="mt-1 text-[11px] text-ink-400">{hint}</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={allowedTypes ? allowedTypes.join(",") : "image/jpeg,image/png,image/webp,image/gif,application/pdf"}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
