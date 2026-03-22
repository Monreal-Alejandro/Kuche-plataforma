"use client";

import { useMemo } from "react";

import type { ItemCatalogo } from "@/lib/levantamiento-catalog";
import { applianceLevantamientoImageCandidates } from "@/lib/levantamiento-catalog";

type Props = {
  item: ItemCatalogo;
  className?: string;
  alt?: string;
};

/**
 * Prueba en cadena: foto en `electrodomesticos/`, alternativas por id, imagen del catálogo y placeholder.
 */
export default function ApplianceTypeImage({
  item,
  className = "h-full w-full object-cover",
  alt,
}: Props) {
  const candidates = useMemo(() => applianceLevantamientoImageCandidates(item), [item]);

  return (
    <img
      src={candidates[0]}
      alt={alt ?? item.label}
      className={className}
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget;
        const idx = Number(el.dataset.appImgIdx ?? "0");
        const next = idx + 1;
        if (next >= candidates.length) {
          el.onerror = null;
          return;
        }
        el.dataset.appImgIdx = String(next);
        el.src = candidates[next]!;
      }}
    />
  );
}
