"use client";

import type { WallDimensionSegment } from "@/lib/levantamiento-catalog";
import {
  WALL_DIAGRAM_CANVAS_PADDING,
  getWallDiagramViewBox,
  getWallMeasureDimensionLines,
  getWallMeasureFieldDefs,
  isWallDimensionInteriorLabel,
  wallDiagramUsesExpandedCanvas,
  wallMeasureLetter,
} from "@/lib/levantamiento-catalog";
import WallMeasureBadgesOverlay from "@/components/levantamiento/WallMeasureBadgesOverlay";

type Props = { wallId: string };

function cotaTitle(letter: string, label: string, hint?: string): string {
  const base = `${letter}: ${label} (metros)`;
  return hint ? `${base}\n\nEn el dibujo: ${hint}` : base;
}

function CotaWithTicks(
  seg: WallDimensionSegment & {
    letter: string;
    label: string;
    hint?: string;
    expanded: boolean;
    internal: boolean;
  },
) {
  const { x1, y1, x2, y2, letter, label, hint, labelDx = 0, labelDy = 0, expanded, internal } = seg;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const lx = mx + labelDx;
  const ly = my + labelDy;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const tickScale = expanded ? 1.55 : 1.0;
  const px = ((-dy / L) * 1.0) * tickScale;
  const py = ((dx / L) * 1.0) * tickScale;
  const swMain = expanded ? 0.98 : 0.65;
  const swTick = expanded ? 0.72 : 0.5;
  const r = expanded ? (internal ? 5.1 : 6.2) : internal ? 3.5 : 3.9;
  const fs = expanded ? (internal ? 5.65 : 7.05) : internal ? 4.05 : 4.6;
  const halo = expanded ? 2.6 : 2.2;

  return (
    <g>
      <title>{cotaTitle(letter, label, hint)}</title>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(20,20,20,0.92)"
        strokeWidth={swMain}
        strokeLinecap="square"
      />
      <line
        x1={x1 + px}
        y1={y1 + py}
        x2={x1 - px}
        y2={y1 - py}
        stroke="rgba(20,20,20,0.92)"
        strokeWidth={swTick}
      />
      <line
        x1={x2 + px}
        y1={y2 + py}
        x2={x2 - px}
        y2={y2 - py}
        stroke="rgba(20,20,20,0.92)"
        strokeWidth={swTick}
      />
      <circle
        cx={lx}
        cy={ly}
        r={r}
        fill="#8B1C1C"
        stroke="#ffffff"
        strokeWidth={halo}
        paintOrder="stroke fill"
      />
      <text
        x={lx}
        y={ly}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={fs}
        fontWeight={700}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {letter}
      </text>
    </g>
  );
}

/**
 * Líneas de medición + marcas en extremos + letra (cotas), si hay datos en el catálogo;
 * si no, solo círculos con letra como antes.
 */
export default function WallMeasureDiagramOverlay({ wallId }: Props) {
  const defs = getWallMeasureFieldDefs(wallId);
  const lines = getWallMeasureDimensionLines(wallId);
  const visibleCount = lines ? Math.min(lines.length, defs.length) : 0;
  const expanded = wallDiagramUsesExpandedCanvas(wallId);
  const pad = expanded ? WALL_DIAGRAM_CANVAS_PADDING : 0;

  if (!lines || visibleCount === 0) {
    return <WallMeasureBadgesOverlay wallId={wallId} />;
  }

  const cotas = lines.slice(0, visibleCount).map((s, i) => {
    const d = defs[i];
    if (!d) return null;
    const letter = d.acronimo ?? wallMeasureLetter(i);
    const internal = expanded && isWallDimensionInteriorLabel(letter);
    return (
      <CotaWithTicks
        key={d.key}
        x1={s.x1}
        y1={s.y1}
        x2={s.x2}
        y2={s.y2}
        labelDx={s.labelDx}
        labelDy={s.labelDy}
        letter={letter}
        label={d.label}
        hint={d.verifyHint}
        expanded={expanded}
        internal={internal}
      />
    );
  });

  return (
    <svg
      viewBox={getWallDiagramViewBox(wallId)}
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Cotas de medición sobre el diagrama"
    >
      {pad > 0 ? <g transform={`translate(${pad},${pad})`}>{cotas}</g> : cotas}
    </svg>
  );
}
