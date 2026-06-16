"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Simple global event bus for toasts
const listeners: ((toast: ToastMessage) => void)[] = [];

export function showToast(message: string, type: ToastType = "info") {
  const toast: ToastMessage = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
  };
  listeners.forEach((l) => l(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-999 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm
            transition-all duration-300 animate-in slide-in-from-bottom-2
            ${toast.type === "success" ? "bg-white border-green-100 text-green-800" : ""}
            ${toast.type === "error" ? "bg-white border-red-100 text-red-800" : ""}
            ${toast.type === "info" ? "bg-white border-sky-100 text-gray-800" : ""}
          `}
        >
          {toast.type === "success" && (
            <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
          )}
          {toast.type === "error" && (
            <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          )}
          {toast.type === "info" && (
            <Info size={16} className="text-sky-500 mt-0.5 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
