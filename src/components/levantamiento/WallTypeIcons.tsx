"use client";

import type { ReactNode, SVGProps } from "react";
import type { WallDimensionSegment } from "@/lib/levantamiento-catalog";
import {
  WALL_DIAGRAM_CANVAS_PADDING,
  WALL_DIAGRAM_VIEWBOX_EXPANDED,
  getWallMeasureDimensionLines,
  getWallMeasureFieldDefs,
  isWallDimensionInteriorLabel,
  wallCotaFocusGroup,
  wallDiagramUsesExpandedCanvas,
  wallMeasureLetter,
  type WallDiagramFocusGroupId,
} from "@/lib/levantamiento-catalog";

/** Referencia legacy catálogo (12×120); el icono `WallIconRecta` usa lienzo fijo 1000×700. */
export const WALL_ICON_ELEVATION = { x: 12, y: 22, w: 96, h: 74 } as const;

/** Rectáculo del muro en coordenadas internas 180×180 (tipos complejos). */
export const WALL_ICON_ELEVATION_EXPANDED = { x: 18, y: 33, w: 144, h: 111 } as const;

const COTA_STROKE = "#8B1C1C";
const COTA_FILL = "#8B1C1C";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export type WallTypeIconProps = IconProps & {
  wallId: string;
  focusedGroup?: WallDiagramFocusGroupId | null;
};

const svgPropsSimple = (props: IconProps): IconProps => ({
  viewBox: "0 0 120 120",
  preserveAspectRatio: "xMidYMid meet",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...props,
  className: props.className,
});

const svgPropsExpanded = (props: IconProps): IconProps => ({
  viewBox: WALL_DIAGRAM_VIEWBOX_EXPANDED,
  preserveAspectRatio: "xMidYMid meet",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...props,
  className: props.className,
});

function PaddedDiagramLayer({ children }: { children: ReactNode }) {
  const p = WALL_DIAGRAM_CANVAS_PADDING;
  return <g transform={`translate(${p},${p})`}>{children}</g>;
}

const wallGeomSimple = { stroke: "currentColor", strokeWidth: 2 as number };
const wallGeomExpanded = { stroke: "currentColor", strokeWidth: 2.35 as number };

/** Sin desplazar cotas ya definidas en coordenadas de alzado (evita incoherencias). */
function nudgeInteriorCota(
  index: number,
  wallId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x1: number; y1: number; x2: number; y2: number } {
  if (wallDiagramUsesExpandedCanvas(wallId)) return { x1, y1, x2, y2 };
  if (wallId === "pared-recta") return { x1, y1, x2, y2 };
  if (index === 0) return { x1, y1, x2, y2 };
  const cx = 60;
  const cy = 56;
  const gap = 2.2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const horiz = Math.abs(y2 - y1) < 0.35;
  const vert = Math.abs(x2 - x1) < 0.35;

  if (horiz) {
    const dir = my >= cy ? -1 : 1;
    const o = dir * gap;
    return { x1, y1: y1 + o, x2, y2: y2 + o };
  }
  if (vert) {
    const dir = mx >= cx ? 1 : -1;
    const o = dir * gap;
    return { x1: x1 + o, y1, x2: x2 + o, y2 };
  }
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  let nx = -(y2 - y1) / len;
  let ny = (x2 - x1) / len;
  if (nx * (mx - cx) + ny * (my - cy) < 0) {
    nx = -nx;
    ny = -ny;
  }
  return {
    x1: x1 + nx * gap,
    y1: y1 + ny * gap,
    x2: x2 + nx * gap,
    y2: y2 + ny * gap,
  };
}

function Cota({
  wallId,
  indexInDiagram,
  x1,
  y1,
  x2,
  y2,
  label,
  labelDx = 0,
  labelDy = 0,
  title: cotaTitle,
  expanded,
  internal,
  focusedGroup,
  cotaGroup,
}: WallDimensionSegment & {
  wallId: string;
  indexInDiagram: number;
  label: string;
  title?: string;
  expanded: boolean;
  internal: boolean;
  focusedGroup: WallDiagramFocusGroupId | null | undefined;
  cotaGroup: WallDiagramFocusGroupId;
}) {
  const safeLabel = label.trim() || "?";
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const labelX = mx + labelDx;
  const labelY = my + labelDy;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const Llen = Math.hypot(dx, dy) || 1;
  const idleOverview = focusedGroup == null;
  const highlighted = focusedGroup != null && focusedGroup === cotaGroup;
  const dimmedOthers = focusedGroup != null && !highlighted;

  const tick = expanded ? 1.85 : 1.25;
  const tx = (-dy / Llen) * tick;
  const ty = (dx / Llen) * tick;

  const swMain = highlighted ? (expanded ? 1.35 : 0.95) : idleOverview ? (expanded ? 0.42 : 0.38) : expanded ? 0.48 : 0.42;
  const swTick = highlighted ? (expanded ? 1.02 : 0.72) : expanded ? 0.38 : 0.34;

  const fs =
    highlighted ? (expanded ? 13.5 : 6.8) : expanded ? (internal ? 5.2 : 6.2) : internal ? 4.05 : 4.6;
  const r = highlighted ? (expanded ? 9 : 4.8) : expanded ? (internal ? 5 : 6.2) : internal ? 3.5 : 3.9;
  const halo = highlighted ? 3.2 : 2.4;

  const strokeColor =
    highlighted ? "currentColor" : dimmedOthers ? "rgba(139,28,28,0.35)" : COTA_STROKE;
  const dashMain = highlighted ? undefined : "5 4";
  const dashTick = highlighted ? undefined : "3 3";

  const groupOpacity = idleOverview ? 0.19 : dimmedOthers ? 0.09 : 1;

  return (
    <g
      className={`transition-all duration-300 ease-out ${highlighted ? "text-[#8B1C1C]" : ""}`}
      style={{ opacity: groupOpacity }}
    >
      {cotaTitle ? <title>{cotaTitle}</title> : null}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={swMain}
        strokeLinecap="square"
        strokeDasharray={dashMain}
      />
      <line
        x1={x1 + tx}
        y1={y1 + ty}
        x2={x1 - tx}
        y2={y1 - ty}
        stroke={strokeColor}
        strokeWidth={swTick}
        strokeLinecap="square"
        strokeDasharray={dashTick}
      />
      <line
        x1={x2 + tx}
        y1={y2 + ty}
        x2={x2 - tx}
        y2={y2 - ty}
        stroke={strokeColor}
        strokeWidth={swTick}
        strokeLinecap="square"
        strokeDasharray={dashTick}
      />
      <circle
        id={`wall-cota-circle-${wallId}-${indexInDiagram}-${safeLabel}`}
        className="wall-cota-id-circle"
        cx={labelX}
        cy={labelY}
        r={r}
        fill={COTA_FILL}
        stroke="#ffffff"
        strokeWidth={halo}
        paintOrder="stroke fill"
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={fs}
        fontWeight={700}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {safeLabel}
      </text>
    </g>
  );
}

function WallTypeCotasGroup({
  wallId,
  focusedGroup,
}: {
  wallId: string;
  focusedGroup?: WallDiagramFocusGroupId | null;
}) {
  const defs = getWallMeasureFieldDefs(wallId);
  const lines = getWallMeasureDimensionLines(wallId);
  if (!lines || lines.length === 0 || defs.length === 0) return null;
  const visibleCount = Math.min(lines.length, defs.length);
  const expanded = wallDiagramUsesExpandedCanvas(wallId);

  return (
    <g className="pointer-events-none" style={{ isolation: "isolate" }}>
      {lines.slice(0, visibleCount).map((seg, i) => {
        const d = defs[i];
        if (!d) return null;
        const n = nudgeInteriorCota(i, wallId, seg.x1, seg.y1, seg.x2, seg.y2);
        const code = (d.acronimo ?? wallMeasureLetter(i)).trim() || wallMeasureLetter(i);
        const internal = expanded && isWallDimensionInteriorLabel(code);
        const cotaGroup = wallCotaFocusGroup(code);
        return (
          <Cota
            key={d.key}
            wallId={wallId}
            indexInDiagram={i}
            x1={n.x1}
            y1={n.y1}
            x2={n.x2}
            y2={n.y2}
            label={code}
            labelDx={seg.labelDx}
            labelDy={seg.labelDy}
            title={`${code}: ${d.label} (m). ${d.verifyHint ?? ""}`}
            expanded={expanded}
            internal={internal}
            focusedGroup={focusedGroup}
            cotaGroup={cotaGroup}
          />
        );
      })}
    </g>
  );
}

/** Cota arquitectónica en lienzo 1000×700 (línea + remates + badge), opacidad por `wallCotaFocusGroup`. */
function MegaArchitectCota({
  focusedGroup,
  cotaGroup,
  letter,
  title,
  x1,
  y1,
  x2,
  y2,
  cx,
  cy,
  wallKey,
  indexInDiagram,
}: {
  focusedGroup?: WallDiagramFocusGroupId | null;
  cotaGroup: WallDiagramFocusGroupId;
  letter: string;
  title: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  wallKey: string;
  indexInDiagram: number;
}) {
  const idleOverview = focusedGroup == null;
  const highlighted = focusedGroup != null && focusedGroup === cotaGroup;
  const dimmedOthers = focusedGroup != null && !highlighted;
  const groupOpacity = idleOverview ? 0.19 : dimmedOthers ? 0.09 : 1;
  const lineStroke = dimmedOthers ? "rgba(139,28,28,0.35)" : "#8B1C1C";
  const dashMain = highlighted ? undefined : "48 36";
  const dashTick = highlighted ? undefined : "28 22";
  const swMain = highlighted ? 14 : idleOverview ? 8 : 9;
  const swTick = highlighted ? 11 : 7;
  const fs = highlighted ? 68 : 54;
  const r = 46;
  const tick = 20;
  const vert = Math.abs(x2 - x1) < 1;
  const horiz = Math.abs(y2 - y1) < 1;

  return (
    <g
      className="pointer-events-none transition-all duration-300 ease-out"
      style={{ isolation: "isolate", opacity: groupOpacity }}
    >
      <title>{title}</title>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineStroke}
        strokeWidth={swMain}
        strokeLinecap="square"
        strokeDasharray={dashMain}
      />
      {vert ? (
        <>
          <line
            x1={x1 - tick}
            y1={y1}
            x2={x1 + tick}
            y2={y1}
            stroke={lineStroke}
            strokeWidth={swTick}
            strokeLinecap="square"
            strokeDasharray={dashTick}
          />
          <line
            x1={x2 - tick}
            y1={y2}
            x2={x2 + tick}
            y2={y2}
            stroke={lineStroke}
            strokeWidth={swTick}
            strokeLinecap="square"
            strokeDasharray={dashTick}
          />
        </>
      ) : horiz ? (
        <>
          <line
            x1={x1}
            y1={y1 - tick}
            x2={x1}
            y2={y1 + tick}
            stroke={lineStroke}
            strokeWidth={swTick}
            strokeLinecap="square"
            strokeDasharray={dashTick}
          />
          <line
            x1={x2}
            y1={y2 - tick}
            x2={x2}
            y2={y2 + tick}
            stroke={lineStroke}
            strokeWidth={swTick}
            strokeLinecap="square"
            strokeDasharray={dashTick}
          />
        </>
      ) : null}
      <circle
        id={`wall-cota-circle-${wallKey}-${indexInDiagram}-${letter}`}
        className="wall-cota-id-circle"
        cx={cx}
        cy={cy}
        r={r}
        fill={COTA_FILL}
        stroke="white"
        strokeWidth={6}
        paintOrder="stroke fill"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={fs}
        fontWeight={700}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {letter}
      </text>
    </g>
  );
}

const { x: WxS, y: WyS, w: WwS, h: WhS } = WALL_ICON_ELEVATION;

const { x: Wx, y: Wy, w: Ww, h: Wh } = WALL_ICON_ELEVATION_EXPANDED;
const Wbottom = Wy + Wh;

/** Icono `pared-recta`: lienzo 1000×700 fijo (muro + cotas H/L), mismas reglas de foco que `Cota`. */
function WallIconRectaMegaCotas({ focusedGroup }: { focusedGroup?: WallDiagramFocusGroupId | null }) {
  const defs = getWallMeasureFieldDefs("pared-recta");
  const defL = defs[0];
  const defH = defs[1];
  const letterL = (defL?.acronimo ?? wallMeasureLetter(0)).trim() || "L";
  const letterH = (defH?.acronimo ?? wallMeasureLetter(1)).trim() || "H";
  const titleL = defL ? `${letterL}: ${defL.label} (m). ${defL.verifyHint ?? ""}` : letterL;
  const titleH = defH ? `${letterH}: ${defH.label} (m). ${defH.verifyHint ?? ""}` : letterH;

  const cotaGroup: WallDiagramFocusGroupId = "general";
  const idleOverview = focusedGroup == null;
  const highlighted = focusedGroup != null && focusedGroup === cotaGroup;
  const dimmedOthers = focusedGroup != null && !highlighted;
  const groupOpacity = idleOverview ? 0.19 : dimmedOthers ? 0.09 : 1;
  const lineStroke = dimmedOthers ? "rgba(139,28,28,0.35)" : "#8B1C1C";
  const dashMain = highlighted ? undefined : "48 36";
  const dashTick = highlighted ? undefined : "28 22";
  const swMain = highlighted ? 14 : idleOverview ? 8 : 9;
  const swTick = highlighted ? 11 : 7;
  const fs = highlighted ? 68 : 54;
  const r = 46;

  return (
    <g
      className="pointer-events-none transition-all duration-300 ease-out"
      style={{ isolation: "isolate", opacity: groupOpacity }}
    >
      <g>
        <title>{titleH}</title>
        <line
          x1={60}
          y1={60}
          x2={60}
          y2={580}
          stroke={lineStroke}
          strokeWidth={swMain}
          strokeLinecap="square"
          strokeDasharray={dashMain}
        />
        <line
          x1={40}
          y1={60}
          x2={80}
          y2={60}
          stroke={lineStroke}
          strokeWidth={swTick}
          strokeLinecap="square"
          strokeDasharray={dashTick}
        />
        <line
          x1={40}
          y1={580}
          x2={80}
          y2={580}
          stroke={lineStroke}
          strokeWidth={swTick}
          strokeLinecap="square"
          strokeDasharray={dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-recta-1-${letterH}`}
          className="wall-cota-id-circle"
          cx={60}
          cy={320}
          r={r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={60}
          y={320}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {letterH}
        </text>
      </g>
      <g>
        <title>{titleL}</title>
        <line
          x1={120}
          y1={640}
          x2={920}
          y2={640}
          stroke={lineStroke}
          strokeWidth={swMain}
          strokeLinecap="square"
          strokeDasharray={dashMain}
        />
        <line
          x1={120}
          y1={620}
          x2={120}
          y2={660}
          stroke={lineStroke}
          strokeWidth={swTick}
          strokeLinecap="square"
          strokeDasharray={dashTick}
        />
        <line
          x1={920}
          y1={620}
          x2={920}
          y2={660}
          stroke={lineStroke}
          strokeWidth={swTick}
          strokeLinecap="square"
          strokeDasharray={dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-recta-0-${letterL}`}
          className="wall-cota-id-circle"
          cx={520}
          cy={640}
          r={r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={520}
          y={640}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {letterL}
        </text>
      </g>
    </g>
  );
}

type WallIconInnerProps = IconProps & { focusedGroup?: WallDiagramFocusGroupId | null };

export function WallIconRecta({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  const svgBase = svgPropsSimple({ ...rest, className: `${className ?? ""} text-primary` });
  return (
    <svg {...svgBase} viewBox="0 0 1000 700" aria-hidden>
      <g className="wall-geometry">
        <rect x={120} y={60} width={800} height={520} fill="none" stroke="currentColor" strokeWidth={14} />
      </g>
      <WallIconRectaMegaCotas focusedGroup={focusedGroup} />
    </svg>
  );
}

/** Estilos de foco/opacidad (misma regla que `MegaArchitectCota`) para iconos 1000×700 con coordenadas fijas. */
function ventanaMegaCotaVisual(
  focusedGroup: WallDiagramFocusGroupId | null | undefined,
  cotaGroup: WallDiagramFocusGroupId,
) {
  const idleOverview = focusedGroup == null;
  const highlighted = focusedGroup != null && focusedGroup === cotaGroup;
  const dimmedOthers = focusedGroup != null && !highlighted;
  return {
    groupOpacity: idleOverview ? 0.19 : dimmedOthers ? 0.09 : 1,
    lineStroke: dimmedOthers ? "rgba(139,28,28,0.35)" : "#8B1C1C",
    dashMain: highlighted ? undefined : "48 36",
    dashTick: highlighted ? undefined : "28 22",
    swMain: highlighted ? 14 : idleOverview ? 8 : 9,
    swTick: highlighted ? 11 : 7,
    fs: highlighted ? 68 : 54,
    r: 46,
  };
}

/** `pared-ventana`: mismo lienzo 1000×700 que recta; cotas fijas con remates y foco por grupo. */
export function WallIconVentana({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  const defs = getWallMeasureFieldDefs("pared-ventana");
  const svgBase = svgPropsSimple({ ...rest, className: `${className ?? ""} text-primary` });
  const ac = (i: number) => (defs[i]?.acronimo ?? wallMeasureLetter(i)).trim() || wallMeasureLetter(i);
  const tit = (i: number) => {
    const d = defs[i];
    const letter = ac(i);
    return d ? `${letter}: ${d.label} (m). ${d.verifyHint ?? ""}` : letter;
  };
  const grp = (i: number) => wallCotaFocusGroup(ac(i));
  const sAv = ventanaMegaCotaVisual(focusedGroup, grp(2));
  const sHv = ventanaMegaCotaVisual(focusedGroup, grp(3));

  return (
    <svg {...svgBase} viewBox="0 0 1000 700" aria-hidden>
      <g className="wall-geometry">
        <rect x={120} y={60} width={800} height={520} fill="none" stroke="currentColor" strokeWidth={14} />
        <rect x={370} y={220} width={300} height={200} fill="none" stroke="currentColor" strokeWidth={10} />
      </g>
      <MegaArchitectCota
        focusedGroup={focusedGroup}
        cotaGroup={grp(0)}
        letter={ac(0)}
        title={tit(0)}
        x1={120}
        y1={640}
        x2={920}
        y2={640}
        cx={520}
        cy={640}
        wallKey="pared-ventana"
        indexInDiagram={0}
      />
      <MegaArchitectCota
        focusedGroup={focusedGroup}
        cotaGroup={grp(1)}
        letter={ac(1)}
        title={tit(1)}
        x1={60}
        y1={60}
        x2={60}
        y2={580}
        cx={60}
        cy={320}
        wallKey="pared-ventana"
        indexInDiagram={1}
      />
      {/* Grupo 2 vano: AV + HV — coordenadas literales (720 para HV, fuera del vano). */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: sAv.groupOpacity }}
      >
        <title>{tit(2)}</title>
        <line
          x1={370}
          y1={380}
          x2={670}
          y2={380}
          stroke={sAv.lineStroke}
          strokeWidth={sAv.swMain}
          strokeLinecap="square"
          strokeDasharray={sAv.dashMain}
        />
        <line
          x1={370}
          y1={360}
          x2={370}
          y2={400}
          stroke={sAv.lineStroke}
          strokeWidth={sAv.swTick}
          strokeLinecap="square"
          strokeDasharray={sAv.dashTick}
        />
        <line
          x1={670}
          y1={360}
          x2={670}
          y2={400}
          stroke={sAv.lineStroke}
          strokeWidth={sAv.swTick}
          strokeLinecap="square"
          strokeDasharray={sAv.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-ventana-2-${ac(2)}`}
          className="wall-cota-id-circle"
          cx={520}
          cy={380}
          r={sAv.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={520}
          y={380}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={sAv.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(2)}
        </text>
      </g>
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: sHv.groupOpacity }}
      >
        <title>{tit(3)}</title>
        <line
          x1={720}
          y1={220}
          x2={720}
          y2={420}
          stroke={sHv.lineStroke}
          strokeWidth={sHv.swMain}
          strokeLinecap="square"
          strokeDasharray={sHv.dashMain}
        />
        <line
          x1={700}
          y1={220}
          x2={740}
          y2={220}
          stroke={sHv.lineStroke}
          strokeWidth={sHv.swTick}
          strokeLinecap="square"
          strokeDasharray={sHv.dashTick}
        />
        <line
          x1={700}
          y1={420}
          x2={740}
          y2={420}
          stroke={sHv.lineStroke}
          strokeWidth={sHv.swTick}
          strokeLinecap="square"
          strokeDasharray={sHv.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-ventana-3-${ac(3)}`}
          className="wall-cota-id-circle"
          cx={720}
          cy={320}
          r={sHv.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={720}
          y={320}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={sHv.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(3)}
        </text>
      </g>
      <MegaArchitectCota
        focusedGroup={focusedGroup}
        cotaGroup={grp(4)}
        letter={ac(4)}
        title={tit(4)}
        x1={520}
        y1={420}
        x2={520}
        y2={580}
        cx={520}
        cy={500}
        wallKey="pared-ventana"
        indexInDiagram={4}
      />
      <MegaArchitectCota
        focusedGroup={focusedGroup}
        cotaGroup={grp(5)}
        letter={ac(5)}
        title={tit(5)}
        x1={520}
        y1={60}
        x2={520}
        y2={220}
        cx={520}
        cy={140}
        wallKey="pared-ventana"
        indexInDiagram={5}
      />
      <MegaArchitectCota
        focusedGroup={focusedGroup}
        cotaGroup={grp(6)}
        letter={ac(6)}
        title={tit(6)}
        x1={120}
        y1={320}
        x2={370}
        y2={320}
        cx={245}
        cy={320}
        wallKey="pared-ventana"
        indexInDiagram={6}
      />
    </svg>
  );
}

/** `pared-puerta`: lienzo 1000×700; cotas con coordenadas literales y foco por grupo. */
export function WallIconPuerta({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  const defs = getWallMeasureFieldDefs("pared-puerta");
  const svgBase = svgPropsSimple({ ...rest, className: `${className ?? ""} text-primary` });
  const ac = (i: number) => (defs[i]?.acronimo ?? wallMeasureLetter(i)).trim() || wallMeasureLetter(i);
  const tit = (i: number) => {
    const d = defs[i];
    const letter = ac(i);
    return d ? `${letter}: ${d.label} (m). ${d.verifyHint ?? ""}` : letter;
  };
  const grp = (i: number) => wallCotaFocusGroup(ac(i));
  const s0 = ventanaMegaCotaVisual(focusedGroup, grp(0));
  const s1 = ventanaMegaCotaVisual(focusedGroup, grp(1));
  const s2 = ventanaMegaCotaVisual(focusedGroup, grp(2));
  const s3 = ventanaMegaCotaVisual(focusedGroup, grp(3));
  const s4 = ventanaMegaCotaVisual(focusedGroup, grp(4));
  const s5 = ventanaMegaCotaVisual(focusedGroup, grp(5));

  return (
    <svg {...svgBase} viewBox="0 0 1000 700" aria-hidden>
      <g className="wall-geometry">
        <rect x={120} y={60} width={800} height={520} fill="none" stroke="currentColor" strokeWidth={14} />
        <rect x={390} y={200} width={260} height={380} fill="none" stroke="currentColor" strokeWidth={10} />
      </g>
      {/* Grupo 1 · L */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: s0.groupOpacity }}
      >
        <title>{tit(0)}</title>
        <line
          x1={120}
          y1={640}
          x2={920}
          y2={640}
          stroke={s0.lineStroke}
          strokeWidth={s0.swMain}
          strokeLinecap="square"
          strokeDasharray={s0.dashMain}
        />
        <line
          x1={120}
          y1={620}
          x2={120}
          y2={660}
          stroke={s0.lineStroke}
          strokeWidth={s0.swTick}
          strokeLinecap="square"
          strokeDasharray={s0.dashTick}
        />
        <line
          x1={920}
          y1={620}
          x2={920}
          y2={660}
          stroke={s0.lineStroke}
          strokeWidth={s0.swTick}
          strokeLinecap="square"
          strokeDasharray={s0.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-puerta-0-${ac(0)}`}
          className="wall-cota-id-circle"
          cx={520}
          cy={640}
          r={s0.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={520}
          y={640}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={s0.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(0)}
        </text>
      </g>
      {/* Grupo 1 · H */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: s1.groupOpacity }}
      >
        <title>{tit(1)}</title>
        <line
          x1={60}
          y1={60}
          x2={60}
          y2={580}
          stroke={s1.lineStroke}
          strokeWidth={s1.swMain}
          strokeLinecap="square"
          strokeDasharray={s1.dashMain}
        />
        <line
          x1={40}
          y1={60}
          x2={80}
          y2={60}
          stroke={s1.lineStroke}
          strokeWidth={s1.swTick}
          strokeLinecap="square"
          strokeDasharray={s1.dashTick}
        />
        <line
          x1={40}
          y1={580}
          x2={80}
          y2={580}
          stroke={s1.lineStroke}
          strokeWidth={s1.swTick}
          strokeLinecap="square"
          strokeDasharray={s1.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-puerta-1-${ac(1)}`}
          className="wall-cota-id-circle"
          cx={60}
          cy={320}
          r={s1.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={60}
          y={320}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={s1.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(1)}
        </text>
      </g>
      {/* Grupo 2 · AP */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: s2.groupOpacity }}
      >
        <title>{tit(2)}</title>
        <line
          x1={390}
          y1={480}
          x2={650}
          y2={480}
          stroke={s2.lineStroke}
          strokeWidth={s2.swMain}
          strokeLinecap="square"
          strokeDasharray={s2.dashMain}
        />
        <line
          x1={390}
          y1={460}
          x2={390}
          y2={500}
          stroke={s2.lineStroke}
          strokeWidth={s2.swTick}
          strokeLinecap="square"
          strokeDasharray={s2.dashTick}
        />
        <line
          x1={650}
          y1={460}
          x2={650}
          y2={500}
          stroke={s2.lineStroke}
          strokeWidth={s2.swTick}
          strokeLinecap="square"
          strokeDasharray={s2.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-puerta-2-${ac(2)}`}
          className="wall-cota-id-circle"
          cx={520}
          cy={480}
          r={s2.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={520}
          y={480}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={s2.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(2)}
        </text>
      </g>
      {/* Grupo 2 · HP (exterior derecha del vano) */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: s3.groupOpacity }}
      >
        <title>{tit(3)}</title>
        <line
          x1={690}
          y1={200}
          x2={690}
          y2={580}
          stroke={s3.lineStroke}
          strokeWidth={s3.swMain}
          strokeLinecap="square"
          strokeDasharray={s3.dashMain}
        />
        <line
          x1={670}
          y1={200}
          x2={710}
          y2={200}
          stroke={s3.lineStroke}
          strokeWidth={s3.swTick}
          strokeLinecap="square"
          strokeDasharray={s3.dashTick}
        />
        <line
          x1={670}
          y1={580}
          x2={710}
          y2={580}
          stroke={s3.lineStroke}
          strokeWidth={s3.swTick}
          strokeLinecap="square"
          strokeDasharray={s3.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-puerta-3-${ac(3)}`}
          className="wall-cota-id-circle"
          cx={690}
          cy={390}
          r={s3.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={690}
          y={390}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={s3.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(3)}
        </text>
      </g>
      {/* Grupo 3 · A */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: s4.groupOpacity }}
      >
        <title>{tit(4)}</title>
        <line
          x1={120}
          y1={390}
          x2={390}
          y2={390}
          stroke={s4.lineStroke}
          strokeWidth={s4.swMain}
          strokeLinecap="square"
          strokeDasharray={s4.dashMain}
        />
        <line
          x1={120}
          y1={370}
          x2={120}
          y2={410}
          stroke={s4.lineStroke}
          strokeWidth={s4.swTick}
          strokeLinecap="square"
          strokeDasharray={s4.dashTick}
        />
        <line
          x1={390}
          y1={370}
          x2={390}
          y2={410}
          stroke={s4.lineStroke}
          strokeWidth={s4.swTick}
          strokeLinecap="square"
          strokeDasharray={s4.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-puerta-4-${ac(4)}`}
          className="wall-cota-id-circle"
          cx={255}
          cy={390}
          r={s4.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={255}
          y={390}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={s4.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(4)}
        </text>
      </g>
      {/* Grupo 3 · TP */}
      <g
        className="pointer-events-none transition-all duration-300 ease-out"
        style={{ isolation: "isolate", opacity: s5.groupOpacity }}
      >
        <title>{tit(5)}</title>
        <line
          x1={520}
          y1={60}
          x2={520}
          y2={200}
          stroke={s5.lineStroke}
          strokeWidth={s5.swMain}
          strokeLinecap="square"
          strokeDasharray={s5.dashMain}
        />
        <line
          x1={500}
          y1={60}
          x2={540}
          y2={60}
          stroke={s5.lineStroke}
          strokeWidth={s5.swTick}
          strokeLinecap="square"
          strokeDasharray={s5.dashTick}
        />
        <line
          x1={500}
          y1={200}
          x2={540}
          y2={200}
          stroke={s5.lineStroke}
          strokeWidth={s5.swTick}
          strokeLinecap="square"
          strokeDasharray={s5.dashTick}
        />
        <circle
          id={`wall-cota-circle-pared-puerta-5-${ac(5)}`}
          className="wall-cota-id-circle"
          cx={520}
          cy={130}
          r={s5.r}
          fill={COTA_FILL}
          stroke="white"
          strokeWidth={6}
          paintOrder="stroke fill"
        />
        <text
          x={520}
          y={130}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={s5.fs}
          fontWeight={700}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {ac(5)}
        </text>
      </g>
    </svg>
  );
}

/** Cota fija icono `pared-2-ventanas` (1000×700): línea + 2 remates + badge. */
function WallIcon2VentanasCotaHard({
  focusedGroup,
  wallKey,
  groupIndex,
  tit,
  ac,
  grp,
  main,
  tickA,
  tickB,
  cx,
  cy,
}: {
  focusedGroup?: WallDiagramFocusGroupId | null;
  wallKey: string;
  groupIndex: number;
  tit: (i: number) => string;
  ac: (i: number) => string;
  grp: (i: number) => WallDiagramFocusGroupId;
  main: { x1: number; y1: number; x2: number; y2: number };
  tickA: { x1: number; y1: number; x2: number; y2: number };
  tickB: { x1: number; y1: number; x2: number; y2: number };
  cx: number;
  cy: number;
}) {
  const s = ventanaMegaCotaVisual(focusedGroup, grp(groupIndex));
  const letter = ac(groupIndex);
  /** Tipografía ~20 % menor y círculo un poco mayor para acrónimos de 3 caracteres (TV1, hV1, …). */
  const badgeFs = Math.round(s.fs * 0.8 * 10) / 10;
  const badgeR = Math.round(s.r * 1.17 * 10) / 10;
  return (
    <g
      className="pointer-events-none transition-all duration-300 ease-out"
      style={{ isolation: "isolate", opacity: s.groupOpacity }}
    >
      <title>{tit(groupIndex)}</title>
      <line
        x1={main.x1}
        y1={main.y1}
        x2={main.x2}
        y2={main.y2}
        stroke={s.lineStroke}
        strokeWidth={s.swMain}
        strokeLinecap="square"
        strokeDasharray={s.dashMain}
      />
      <line
        x1={tickA.x1}
        y1={tickA.y1}
        x2={tickA.x2}
        y2={tickA.y2}
        stroke={s.lineStroke}
        strokeWidth={s.swTick}
        strokeLinecap="square"
        strokeDasharray={s.dashTick}
      />
      <line
        x1={tickB.x1}
        y1={tickB.y1}
        x2={tickB.x2}
        y2={tickB.y2}
        stroke={s.lineStroke}
        strokeWidth={s.swTick}
        strokeLinecap="square"
        strokeDasharray={s.dashTick}
      />
      <circle
        id={`wall-cota-circle-${wallKey}-${groupIndex}-${letter}`}
        className="wall-cota-id-circle"
        cx={cx}
        cy={cy}
        r={badgeR}
        fill={COTA_FILL}
        stroke="white"
        strokeWidth={6}
        paintOrder="stroke fill"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        alignmentBaseline="middle"
        fill="#fff"
        fontSize={badgeFs}
        fontWeight={700}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {letter}
      </text>
    </g>
  );
}

/** `pared-2-ventanas`: lienzo 1000×700; vanos y ubicación por ventana (HV1/HV2, hV1/hV2, TV1/TV2). */
export function WallIcon2Ventanas({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  const defs = getWallMeasureFieldDefs("pared-2-ventanas");
  const svgBase = svgPropsSimple({ ...rest, className: `${className ?? ""} text-primary` });
  const ac = (i: number) => (defs[i]?.acronimo ?? wallMeasureLetter(i)).trim() || wallMeasureLetter(i);
  const tit = (i: number) => {
    const d = defs[i];
    const letter = ac(i);
    return d ? `${letter}: ${d.label} (m). ${d.verifyHint ?? ""}` : letter;
  };
  const grp = (i: number) => wallCotaFocusGroup(ac(i));
  const wk = "pared-2-ventanas";

  return (
    <svg {...svgBase} viewBox="0 0 1000 700" aria-hidden>
      <g className="wall-geometry">
        <rect x={120} y={60} width={800} height={520} fill="none" stroke="currentColor" strokeWidth={14} />
        <rect x={220} y={220} width={200} height={200} fill="none" stroke="currentColor" strokeWidth={10} />
        <rect x={620} y={220} width={200} height={200} fill="none" stroke="currentColor" strokeWidth={10} />
      </g>
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={0}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 120, y1: 640, x2: 920, y2: 640 }}
        tickA={{ x1: 120, y1: 620, x2: 120, y2: 660 }}
        tickB={{ x1: 920, y1: 620, x2: 920, y2: 660 }}
        cx={520}
        cy={640}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={1}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 60, y1: 60, x2: 60, y2: 580 }}
        tickA={{ x1: 40, y1: 60, x2: 80, y2: 60 }}
        tickB={{ x1: 40, y1: 580, x2: 80, y2: 580 }}
        cx={60}
        cy={320}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={2}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 220, y1: 380, x2: 420, y2: 380 }}
        tickA={{ x1: 220, y1: 360, x2: 220, y2: 400 }}
        tickB={{ x1: 420, y1: 360, x2: 420, y2: 400 }}
        cx={320}
        cy={380}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={3}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 620, y1: 380, x2: 820, y2: 380 }}
        tickA={{ x1: 620, y1: 360, x2: 620, y2: 400 }}
        tickB={{ x1: 820, y1: 360, x2: 820, y2: 400 }}
        cx={720}
        cy={380}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={4}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 170, y1: 220, x2: 170, y2: 420 }}
        tickA={{ x1: 150, y1: 220, x2: 190, y2: 220 }}
        tickB={{ x1: 150, y1: 420, x2: 190, y2: 420 }}
        cx={170}
        cy={320}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={5}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 870, y1: 220, x2: 870, y2: 420 }}
        tickA={{ x1: 850, y1: 220, x2: 890, y2: 220 }}
        tickB={{ x1: 850, y1: 420, x2: 890, y2: 420 }}
        cx={870}
        cy={320}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={6}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 120, y1: 460, x2: 220, y2: 460 }}
        tickA={{ x1: 120, y1: 450, x2: 120, y2: 470 }}
        tickB={{ x1: 220, y1: 450, x2: 220, y2: 470 }}
        cx={170}
        cy={535}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={7}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 420, y1: 320, x2: 620, y2: 320 }}
        tickA={{ x1: 420, y1: 300, x2: 420, y2: 340 }}
        tickB={{ x1: 620, y1: 300, x2: 620, y2: 340 }}
        cx={520}
        cy={320}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={8}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 320, y1: 420, x2: 320, y2: 580 }}
        tickA={{ x1: 300, y1: 420, x2: 340, y2: 420 }}
        tickB={{ x1: 300, y1: 580, x2: 340, y2: 580 }}
        cx={320}
        cy={500}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={9}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 720, y1: 420, x2: 720, y2: 580 }}
        tickA={{ x1: 700, y1: 420, x2: 740, y2: 420 }}
        tickB={{ x1: 700, y1: 580, x2: 740, y2: 580 }}
        cx={720}
        cy={500}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={10}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 320, y1: 60, x2: 320, y2: 220 }}
        tickA={{ x1: 300, y1: 60, x2: 340, y2: 60 }}
        tickB={{ x1: 300, y1: 220, x2: 340, y2: 220 }}
        cx={320}
        cy={140}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={11}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 720, y1: 60, x2: 720, y2: 220 }}
        tickA={{ x1: 700, y1: 60, x2: 740, y2: 60 }}
        tickB={{ x1: 700, y1: 220, x2: 740, y2: 220 }}
        cx={720}
        cy={140}
      />
      <WallIcon2VentanasCotaHard
        focusedGroup={focusedGroup}
        wallKey={wk}
        groupIndex={12}
        tit={tit}
        ac={ac}
        grp={grp}
        main={{ x1: 820, y1: 460, x2: 920, y2: 460 }}
        tickA={{ x1: 820, y1: 450, x2: 820, y2: 470 }}
        tickB={{ x1: 920, y1: 450, x2: 920, y2: 470 }}
        cx={870}
        cy={535}
      />
    </svg>
  );
}

/** Puerta 21–66 ×84 | ventana 93–147 ×42. */
export function WallIconPuertaVentana({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  return (
    <svg {...svgPropsExpanded({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <PaddedDiagramLayer>
        <g className="wall-geometry">
          <rect x={Wx} y={Wy} width={Ww} height={Wh} {...wallGeomExpanded} />
          <rect x={21} y={60} width={45} height={84} {...wallGeomExpanded} />
          <rect x={93} y={57} width={54} height={42} {...wallGeomExpanded} />
        </g>
        <WallTypeCotasGroup wallId="pared-puerta-ventana" focusedGroup={focusedGroup} />
      </PaddedDiagramLayer>
    </svg>
  );
}

/** V1 21–51 | puerta 57–105 | V2 129–159. */
export function WallIconPuerta2Ventanas({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  return (
    <svg {...svgPropsExpanded({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <PaddedDiagramLayer>
        <g className="wall-geometry">
          <rect x={Wx} y={Wy} width={Ww} height={Wh} {...wallGeomExpanded} />
          <rect x={21} y={60} width={30} height={39} {...wallGeomExpanded} />
          <rect x={57} y={57} width={48} height={87} {...wallGeomExpanded} />
          <rect x={129} y={60} width={30} height={39} {...wallGeomExpanded} />
        </g>
        <WallTypeCotasGroup wallId="pared-puerta-2-ventanas" focusedGroup={focusedGroup} />
      </PaddedDiagramLayer>
    </svg>
  );
}

/** Puertas 27–69 y 111–153. */
export function WallIcon2Puertas({ className, focusedGroup, ...rest }: WallIconInnerProps) {
  const pw = 42;
  const ph = Wbottom - 57;
  return (
    <svg {...svgPropsExpanded({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <PaddedDiagramLayer>
        <g className="wall-geometry">
          <rect x={Wx} y={Wy} width={Ww} height={Wh} {...wallGeomExpanded} />
          <rect x={27} y={57} width={pw} height={ph} {...wallGeomExpanded} />
          <rect x={111} y={57} width={pw} height={ph} {...wallGeomExpanded} />
        </g>
        <WallTypeCotasGroup wallId="pared-2-puertas" focusedGroup={focusedGroup} />
      </PaddedDiagramLayer>
    </svg>
  );
}

const FALLBACK_KEYS = new Set(["otro", "pared-otro", ""]);

export function WallTypeIcon({ wallId, focusedGroup = null, className, ...rest }: WallTypeIconProps) {
  const base = `text-primary h-full w-full ${className ?? ""}`.trim();

  if (FALLBACK_KEYS.has(wallId)) {
    return (
      <svg {...svgPropsSimple({ ...rest, role: "img", className: base })}>
        <g className="wall-geometry">
          <rect
            x={12}
            y={22}
            width={96}
            height={74}
            stroke="currentColor"
            strokeWidth={2}
            opacity={0.3}
            strokeDasharray="6 6"
          />
          <text x={60} y={62} textAnchor="middle" className="fill-current text-[10px] font-semibold">
            Otro
          </text>
        </g>
      </svg>
    );
  }

  switch (wallId) {
    case "pared-recta":
      return <WallIconRecta className={base} focusedGroup={focusedGroup} {...rest} />;
    case "pared-ventana":
      return <WallIconVentana className={base} focusedGroup={focusedGroup} {...rest} />;
    case "pared-puerta":
      return <WallIconPuerta className={base} focusedGroup={focusedGroup} {...rest} />;
    case "pared-2-ventanas":
      return <WallIcon2Ventanas className={base} focusedGroup={focusedGroup} {...rest} />;
    case "pared-puerta-ventana":
      return <WallIconPuertaVentana className={base} focusedGroup={focusedGroup} {...rest} />;
    case "pared-puerta-2-ventanas":
      return <WallIconPuerta2Ventanas className={base} focusedGroup={focusedGroup} {...rest} />;
    case "pared-2-puertas":
      return <WallIcon2Puertas className={base} focusedGroup={focusedGroup} {...rest} />;
    default:
      return <WallIconRecta className={base} focusedGroup={focusedGroup} {...rest} />;
  }
}
