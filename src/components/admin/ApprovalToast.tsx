"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle, X } from "lucide-react";

type ApprovalToastProps = {
  type: "success" | "error";
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDuration?: number;
};

export function ApprovalToast({
  type,
  message,
  isVisible,
  onClose,
  autoCloseDuration = 5000,
}: ApprovalToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onClose, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [isVisible, autoCloseDuration, onClose]);

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-emerald-50" : "bg-rose-50";
  const borderColor = isSuccess ? "border-emerald-200" : "border-rose-200";
  const textColor = isSuccess ? "text-emerald-800" : "text-rose-800";
  const iconBg = isSuccess ? "bg-emerald-100" : "bg-rose-100";
  const iconColor = isSuccess ? "text-emerald-600" : "text-rose-600";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed right-4 top-4 z-50 flex items-start gap-3 rounded-2xl border ${borderColor} ${bgColor} p-4 shadow-lg md:right-6 md:top-6`}
        >
          <div className={`flex-shrink-0 rounded-full ${iconBg} p-2`}>
            {isSuccess ? (
              <Check className={`h-5 w-5 ${iconColor}`} />
            ) : (
              <AlertCircle className={`h-5 w-5 ${iconColor}`} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <p className={`text-sm font-semibold ${textColor}`}>
              {isSuccess ? "¡Listo!" : "Error"}
            </p>
            <p className={`text-sm ${textColor} opacity-90`}>{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`flex-shrink-0 rounded-full p-1 transition hover:opacity-75 ${textColor}`}
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
