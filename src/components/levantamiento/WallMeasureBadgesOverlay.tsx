"use client";

import {
  getWallMeasureBadgePositions,
  getWallMeasureFieldDefs,
  wallMeasureLetter,
} from "@/lib/levantamiento-catalog";

type Props = { wallId: string };

/** Badges A, B, C… sobre la imagen del tipo de muro (posiciones en catálogo o cuadrícula). */
export default function WallMeasureBadgesOverlay({ wallId }: Props) {
  const defs = getWallMeasureFieldDefs(wallId);
  const positions = getWallMeasureBadgePositions(wallId);
  return (
    <>
      {defs.map((d, i) => (
        <span
          key={d.key}
          className="pointer-events-none absolute z-[5] flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-white/90 bg-[#8B1C1C] px-1 text-[10px] font-bold text-white shadow-md"
          style={{
            top: positions[i]?.top ?? "10%",
            left: positions[i]?.left ?? "10%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {wallMeasureLetter(i)}
        </span>
      ))}
    </>
  );
}
