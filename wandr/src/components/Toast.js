import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export default function Toast() {
  const { toast, clearToast } = useToast();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
