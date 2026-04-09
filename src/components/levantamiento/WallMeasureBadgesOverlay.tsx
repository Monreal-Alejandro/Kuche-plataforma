"use client";

import { getWallMeasureFieldDefs } from "@/lib/levantamiento-catalog";

type Props = { wallId: string };

export function wallMeasureLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function badgeTitle(letter: string, label: string): string {
  return `${letter}: ${label}`;
}

function getPosition(index: number, count: number): { top: string; left: string } {
  const layouts: Record<number, Array<{ top: string; left: string }>> = {
    1: [{ top: "52%", left: "50%" }],
    2: [
      { top: "22%", left: "30%" },
      { top: "22%", left: "70%" },
    ],
    3: [
      { top: "20%", left: "50%" },
      { top: "66%", left: "28%" },
      { top: "66%", left: "72%" },
    ],
    4: [
      { top: "20%", left: "30%" },
      { top: "20%", left: "70%" },
      { top: "72%", left: "30%" },
      { top: "72%", left: "70%" },
    ],
  };

  const fallback = [
    { top: "18%", left: "50%" },
    { top: "50%", left: "24%" },
    { top: "50%", left: "76%" },
    { top: "82%", left: "50%" },
    { top: "30%", left: "36%" },
    { top: "30%", left: "64%" },
  ];

  return layouts[count]?.[index] ?? fallback[index] ?? { top: "50%", left: "50%" };
}

export default function WallMeasureBadgesOverlay({ wallId }: Props) {
  const defs = getWallMeasureFieldDefs(wallId);
  if (defs.length === 0) return null;

  return (
    <>
      {defs.map((definition, index) => {
        const letter = wallMeasureLetter(index);
        const position = getPosition(index, defs.length);
        return (
          <span
            key={definition.key}
            className="pointer-events-none absolute z-[6] flex h-6 min-w-[1.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/95 bg-[#8B1C1C] px-1 text-[10px] font-bold tabular-nums text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            style={{ top: position.top, left: position.left }}
            title={badgeTitle(letter, definition.label)}
          >
            {letter}
          </span>
        );
      })}
    </>
  );
}