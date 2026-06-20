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

/** Logo NADIRA — médaillon officiel (PNG transparent) utilisé partout */
export function NadiraMonogram({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <img
      src="/nadira-logo.png"
      alt="NADIRA Couture"
      className={cn(
        "object-contain",
        animate && "animate-[fade-up_1.2s_ease_forwards]",
        className
      )}
      style={animate ? { animation: "fade-up 1.2s ease forwards" } : undefined}
    />
  );
}

/** Médaillon complet NADIRA — logo officiel PNG (footer, sceaux, confirmation) */
export function NadiraMedallion({ className }: { className?: string }) {
  return (
    <img
      src="/nadira-logo.png"
      alt="NADIRA Couture"
      className={cn("object-contain", className)}
    />
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
