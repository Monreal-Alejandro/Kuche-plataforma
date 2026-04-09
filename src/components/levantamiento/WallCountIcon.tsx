"use client";

import type { ReactNode } from "react";

const wallCountSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function WallCountIcon({ count, className }: { count: number; className?: string }) {
  const svg = (children: ReactNode) => (
    <svg className={className} aria-hidden {...wallCountSvgProps}>
      {children}
    </svg>
  );

  switch (count) {
    case 1:
      return svg(<line x1="4" y1="12" x2="20" y2="12" />);
    case 2:
      return svg(<path d="M 6 6 L 6 18 L 18 18" />);
    case 3:
      return svg(<path d="M 6 5 L 6 19 L 18 19 L 18 5" />);
    case 4:
      return svg(<path d="M 6 6 L 18 6 L 18 18 L 6 18 Z" />);
    case 5:
      return svg(<path d="M 5 5 L 5 19 L 19 19 L 19 10 L 13 10 L 13 5" />);
    case 6:
      return svg(<path d="M 4 4 L 4 13 L 12 13 L 12 8 L 20 8 L 20 18" />);
    case 7:
      return svg(<path d="M 3 6 L 3 18 L 11 18 L 11 10 L 17 10 L 17 18 L 21 18 L 21 6" />);
    case 8:
      return svg(<path d="M 3 5 L 3 16 L 9 16 L 9 9 L 15 9 L 15 17 L 21 17 L 21 8 L 14 8" />);
    default:
      return svg(<line x1="4" y1="12" x2="20" y2="12" />);
  }
}