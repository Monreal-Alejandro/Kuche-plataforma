"use client";

import type { SVGProps } from "react";
import { getWallMeasureFieldDefs } from "@/lib/levantamiento-catalog";
import WallMeasureBadgesOverlay, { wallMeasureLetter } from "@/components/levantamiento/WallMeasureBadgesOverlay";

type Props = { wallId: string };

type GuideProps = SVGProps<SVGLineElement>;

function GuideLine(props: GuideProps) {
  return <line stroke="rgba(139,28,28,0.22)" strokeWidth={0.75} strokeLinecap="round" {...props} />;
}

export default function WallMeasureDiagramOverlay({ wallId }: Props) {
  const defs = getWallMeasureFieldDefs(wallId);
  if (defs.length === 0) return null;

  const count = defs.length;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {count >= 1 ? <GuideLine x1={18} y1={22} x2={102} y2={22} /> : null}
        {count >= 2 ? <GuideLine x1={18} y1={98} x2={102} y2={98} /> : null}
        {count >= 3 ? <GuideLine x1={22} y1={28} x2={22} y2={92} /> : null}
        {count >= 4 ? <GuideLine x1={98} y1={28} x2={98} y2={92} /> : null}
        {count >= 5 ? <GuideLine x1={32} y1={32} x2={88} y2={32} /> : null}
        {count >= 6 ? <GuideLine x1={32} y1={88} x2={88} y2={88} /> : null}
        {defs.slice(0, 6).map((definition, index) => {
          const letter = wallMeasureLetter(index);
          const x = [28, 92, 28, 92, 44, 76][index] ?? 60;
          const y = [28, 28, 92, 92, 60, 60][index] ?? 60;
          return (
            <g key={definition.key}>
              <circle cx={x} cy={y} r={4.25} fill="#8B1C1C" stroke="#fff" strokeWidth={0.75} />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={4.6}
                fontWeight={700}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {letter}
              </text>
            </g>
          );
        })}
      </svg>
      <WallMeasureBadgesOverlay wallId={wallId} />
    </div>
  );
}