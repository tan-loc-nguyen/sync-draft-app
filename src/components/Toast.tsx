import { useCallback, useEffect, useState } from 'react';

type ToastKind = 'ok' | 'error';

interface Toast {
  message: string;
  kind: ToastKind;
}

/**
 * Small non-blocking status message.
 *
 * Replaces window.alert() for routine feedback: an alert halts the page until
 * it is dismissed, which is heavy-handed for "saved" and impossible to use in
 * an automated check.
 */
export const useToast = () => {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string, kind: ToastKind = 'ok') => {
    setToast({ message, kind });
  }, []);

  const toastElement = toast ? (
    <div
      role='status'
      aria-live='polite'
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-lg shadow-lg text-sm ${
        toast.kind === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
      }`}
    >
      {toast.message}
    </div>
  ) : null;

  return { notify, toastElement };
};
