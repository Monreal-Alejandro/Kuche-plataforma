import { useEffect } from "react";

type EscapeCloseHandler = () => void;

export const useEscapeClose = (isOpen: boolean, onClose: EscapeCloseHandler) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
};
