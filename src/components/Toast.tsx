import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'success'
            ? CheckCircle2
            : toast.tone === 'error'
              ? AlertCircle
              : Info;
        const borderClass =
          toast.tone === 'error'
            ? 'border-[#D99B9B] bg-[#FDF7F7]'
            : toast.tone === 'success'
              ? 'border-[#C5DAC7] bg-[#F6FAF6]'
              : 'border-[#EAE4DD] bg-[#FCFBFA]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-sm text-sm text-[#29272B] ${borderClass}`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[#6B6770]" />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#6B6770] hover:text-[#29272B] shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
