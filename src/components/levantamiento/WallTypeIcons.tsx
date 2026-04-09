"use client";

import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { wallId: string };

const svgProps = ({ wallId: _wallId, ...props }: IconProps): SVGProps<SVGSVGElement> => ({
  viewBox: "0 0 120 120",
  preserveAspectRatio: "xMidYMid meet",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...props,
  className: props.className,
});

const wallGeom = { stroke: "currentColor", strokeWidth: 2 as number };

const frame = { x: 12, y: 22, w: 96, h: 74 } as const;

function WallFrame({ children }: { children?: ReactNode }) {
  return (
    <g>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} {...wallGeom} />
      {children}
    </g>
  );
}

export function WallIconRecta({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame />
    </svg>
  );
}

export function WallIconVentana({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <rect x={36} y={44} width={48} height={24} {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconPuerta({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <rect x={44} y={38} width={32} height={58} {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconEsquina90({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <path d="M 28 30 L 28 94 L 92 94" {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconNicho({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <rect x={38} y={36} width={44} height={22} {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconMediaAltura({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <path d="M 12 72 H 60 V 96" {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconDivisoria({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <path d="M 20 34 L 100 86" {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconFalsoMuro({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <rect x={24} y={34} width={72} height={12} rx={6} {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconSalientes({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <path d="M 24 88 H 56 V 58 H 84" {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallIconL({ className, ...rest }: IconProps) {
  return (
    <svg {...svgProps({ ...rest, className: `${className ?? ""} text-primary` })} aria-hidden>
      <WallFrame>
        <path d="M 20 36 L 20 94 L 92 94" {...wallGeom} />
      </WallFrame>
    </svg>
  );
}

export function WallTypeIcon({ wallId, className, ...rest }: IconProps) {
  switch (wallId) {
    case "pared-ventana":
      return <WallIconVentana wallId={wallId} className={className} {...rest} />;
    case "pared-puerta":
      return <WallIconPuerta wallId={wallId} className={className} {...rest} />;
    case "esquina-90":
      return <WallIconEsquina90 wallId={wallId} className={className} {...rest} />;
    case "pared-nicho":
      return <WallIconNicho wallId={wallId} className={className} {...rest} />;
    case "pared-media-altura":
      return <WallIconMediaAltura wallId={wallId} className={className} {...rest} />;
    case "pared-divisoria":
      return <WallIconDivisoria wallId={wallId} className={className} {...rest} />;
    case "falso-muro":
      return <WallIconFalsoMuro wallId={wallId} className={className} {...rest} />;
    case "pared-salientes":
      return <WallIconSalientes wallId={wallId} className={className} {...rest} />;
    case "pared-l":
      return <WallIconL wallId={wallId} className={className} {...rest} />;
    case "pared-recta":
    default:
      return <WallIconRecta wallId={wallId} className={className} {...rest} />;
  }
}