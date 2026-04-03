"use client";

import { useEffect } from "react";

/**
 * Evita que la rueda del ratón cambie el valor de inputs `type="number"` cuando están enfocados.
 * El scroll de la página sigue funcionando si el foco no está en un input numérico.
 */
export default function NumberInputWheelGuard() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === "number") {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, []);
  return null;
}
