"use client";

import type { ItemCatalogo } from "@/lib/levantamiento-catalog";
import { wallTypeImageSrc } from "@/lib/levantamiento-catalog";

type Props = {
  item: ItemCatalogo;
  className?: string;
  alt?: string;
};

/**
 * Intenta cargar la imagen dedicada en `public/images/levantamiento/paredes/{id}.jpg`;
 * si falla, usa la textura de respaldo del catálogo y, en último caso, el placeholder del sitio.
 */
export default function WallTypeImage({ item, className = "h-full w-full object-cover", alt }: Props) {
  return (
    <img
      src={wallTypeImageSrc(item.id)}
      alt={alt ?? item.label}
      className={className}
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.getAttribute("data-wall-img-step") === "1") {
          el.onerror = null;
          el.src = "/images/ui/hero-placeholder.svg";
          return;
        }
        el.setAttribute("data-wall-img-step", "1");
        el.src = item.image;
      }}
    />
  );
}
