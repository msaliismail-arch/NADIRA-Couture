import { cn } from "@/lib/utils";

/**
 * NADIRA brand SVG components.
 * - NadiraMonogram: épure "N" doré brodé (header, loader, hero)
 * - NadiraMedallion: médaillon complet (footer, sceaux, confirmation)
 * - KhatimStar: étoile marocaine à 8 branches (motif récurrent)
 * - GoldDivider: séparateur avec losange doré
 */

export function KhatimStar({
  className,
  strokeWidth = 1,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
    >
      {/* Khatim — étoile à 8 branches formée de deux carrés superposés */}
      <g>
        <rect x="22" y="22" width="56" height="56" transform="rotate(0 50 50)" />
        <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="14" />
        <rect x="35" y="35" width="30" height="30" transform="rotate(0 50 50)" />
        <rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)" />
      </g>
    </svg>
  );
}

/** Monogramme "N" doré brodé — version épurée pour header / hero / loader */
export function NadiraMonogram({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn(animate && "embroider", className)}
      fill="none"
      aria-label="Monogramme NADIRA"
      role="img"
    >
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0DCA0" />
          <stop offset="45%" stopColor="#C9A24B" />
          <stop offset="75%" stopColor="#A9842D" />
          <stop offset="100%" stopColor="#E3C879" />
        </linearGradient>
      </defs>
      {/* The "N" stitched in gold */}
      <g
        stroke="url(#gold-grad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Left vertical */}
        <path d="M 38 26 L 38 94" />
        {/* Diagonal */}
        <path d="M 38 26 L 82 94" />
        {/* Right vertical */}
        <path d="M 82 26 L 82 94" />
      </g>
      {/* Needle + thread flourish */}
      <g stroke="url(#gold-grad)" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        <path d="M 30 30 Q 22 50 30 70" />
        <circle cx="29" cy="30" r="2.4" fill="url(#gold-grad)" stroke="none" />
        <path d="M 90 86 Q 98 66 90 46" />
        <circle cx="91" cy="86" r="2.4" fill="url(#gold-grad)" stroke="none" />
      </g>
      {/* Small khatim above */}
      <g stroke="url(#gold-grad)" strokeWidth="1.4" opacity="0.7" transform="translate(50 8) scale(0.18)">
        <rect x="0" y="0" width="100" height="100" />
        <rect x="0" y="0" width="100" height="100" transform="rotate(45 50 50)" />
      </g>
    </svg>
  );
}

/** Médaillon complet NADIRA — pour footer, sceaux, confirmation de commande */
export function NadiraMedallion({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      aria-label="Sceau NADIRA Couture"
      role="img"
    >
      <defs>
        <radialGradient id="med-velvet" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#14543F" />
          <stop offset="60%" stopColor="#0E3B2E" />
          <stop offset="100%" stopColor="#082018" />
        </radialGradient>
        <linearGradient id="med-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0DCA0" />
          <stop offset="45%" stopColor="#C9A24B" />
          <stop offset="80%" stopColor="#A9842D" />
          <stop offset="100%" stopColor="#E3C879" />
        </linearGradient>
      </defs>

      {/* Outer ornate ring */}
      <circle cx="120" cy="120" r="116" fill="url(#med-gold)" />
      <circle cx="120" cy="120" r="110" fill="url(#med-velvet)" />

      {/* Beaded inner border */}
      <circle cx="120" cy="120" r="104" fill="none" stroke="url(#med-gold)" strokeWidth="1.5" />
      <g fill="url(#med-gold)">
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r = 99;
          return (
            <circle key={i} cx={120 + Math.cos(a) * r} cy={120 + Math.sin(a) * r} r="1.4" />
          );
        })}
      </g>

      {/* Decorative scalloped band */}
      <g stroke="url(#med-gold)" strokeWidth="1.2" fill="none" opacity="0.9">
        <circle cx="120" cy="120" r="92" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const r = 86;
          return (
            <circle
              key={i}
              cx={120 + Math.cos(a) * r}
              cy={120 + Math.sin(a) * r}
              r="5"
            />
          );
        })}
      </g>

      {/* Cardinal ornaments (top/bottom/left/right) */}
      <g fill="url(#med-gold)" opacity="0.95">
        <KhatimOrnament cx={120} cy={36} scale={0.5} />
        <KhatimOrnament cx={120} cy={204} scale={0.5} />
        <KhatimOrnament cx={36} cy={120} scale={0.5} />
        <KhatimOrnament cx={204} cy={120} scale={0.5} />
      </g>

      {/* Monogram N (central) */}
      <g
        stroke="url(#med-gold)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M 92 78 L 92 162" />
        <path d="M 92 78 L 148 162" />
        <path d="M 148 78 L 148 162" />
      </g>

      {/* Wordmark NADIRA */}
      <g fill="url(#med-gold)" fontFamily="var(--font-display), Georgia, serif" fontWeight="600">
        <text
          x="120"
          y="178"
          textAnchor="middle"
          fontSize="15"
          letterSpacing="3"
        >
          NADIRA
        </text>
      </g>
      {/* Tiny separator line under wordmark */}
      <g stroke="url(#med-gold)" strokeWidth="1">
        <line x1="92" y1="186" x2="148" y2="186" />
      </g>
      <g fill="url(#med-gold)">
        <rect x="116" y="184" width="8" height="4" transform="rotate(45 120 186)" />
      </g>
    </svg>
  );
}

function KhatimOrnament({
  cx,
  cy,
  scale = 1,
}: {
  cx: number;
  cy: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <g fill="none" stroke="url(#med-gold)" strokeWidth="1.4">
        <rect x="-22" y="-22" width="44" height="44" />
        <rect x="-22" y="-22" width="44" height="44" transform="rotate(45)" />
        <circle r="12" />
      </g>
    </g>
  );
}

/** Séparateur doré avec losange central — motif récurrent du logo */
export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-6", className)}>
      <span className="h-px w-16 sm:w-24 gold-line" />
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold" fill="currentColor" aria-hidden>
        <rect x="3" y="3" width="18" height="18" transform="rotate(45 12 12)" />
      </svg>
      <span className="h-px w-16 sm:w-24 gold-line" />
    </div>
  );
}

/** Petit logo combiné : monogramme + mot NADIRA pour header sticky */
export function NadiraWordmark({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <NadiraMonogram className="h-9 w-9 shrink-0" />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-xl font-semibold tracking-[0.22em]",
            onDark ? "text-gold-light" : "text-emerald-deep"
          )}
        >
          NADIRA
        </span>
        <span
          className={cn(
            "text-[9px] tracking-[0.34em] uppercase mt-0.5",
            onDark ? "text-ivory/60" : "text-gold-deep"
          )}
        >
          Couture · Maroc
        </span>
      </div>
    </div>
  );
}
