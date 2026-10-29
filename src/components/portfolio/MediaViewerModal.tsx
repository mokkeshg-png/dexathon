import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { isPdf } from "@/lib/storage";
import { Download, ExternalLink, FileText } from "lucide-react";

interface MediaViewerModalProps {
  open: boolean;
  onClose: () => void;
  url: string | null;
  title?: string;
}

export function MediaViewerModal({ open, onClose, url, title = "Media Preview" }: MediaViewerModalProps) {
  if (!url) return null;

  const pdf = isPdf(url);

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4">
        {pdf ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-paper-50 p-8 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700 shadow-sm">
              <FileText className="h-8 w-8" />
            </div>
            <h4 className="font-serif text-lg font-bold text-ink">Portable Document Format (PDF)</h4>
            <p className="mt-1 text-xs text-ink-500 max-w-sm">
              This verified credential or artifact is available for inline viewing or download.
            </p>
            <div className="mt-5 flex gap-3">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button className="flex items-center gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </a>
              <a href={url} download="credential-document.pdf">
                <Button variant="outline" className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100 bg-black/5 flex items-center justify-center max-h-[70vh]">
            <img
              src={url}
              alt={title}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <span className="text-[11px] text-ink-400 truncate max-w-md">
            Verified academic artifact & portfolio asset
          </span>
          <div className="flex gap-2">
            {!pdf && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Full Resolution
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
