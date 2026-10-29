import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#181B1F]/45 backdrop-blur-sm transition-opacity" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-8">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            className={`clay-modal-panel w-full p-6 sm:p-8 animate-scale-in ${wide ? "max-w-3xl" : "max-w-lg"}`}
          >
            {/* Modal Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <DialogTitle className="font-serif text-xl font-extrabold text-[#181B1F] leading-tight pr-4">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="clay-btn-icon h-8 w-8 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Separator */}
            <div className="clay-divider mb-5" />
            
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
