// src/app/hook/useToast.tsx
"use client";

import { useState, useCallback } from "react";

interface ToastState {
  show: boolean;
  type: "success" | "error";
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return { toast, showToast, hideToast };
}