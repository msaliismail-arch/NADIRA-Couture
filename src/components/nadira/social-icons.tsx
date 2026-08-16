"use client";

/**
 * NADIRA Couture — Icônes des réseaux sociaux.
 * Instagram et Facebook viennent de lucide-react ; TikTok et WhatsApp
 * sont des SVG maison au même style (stroke/fill sur currentColor).
 */

import { Instagram, Facebook } from "lucide-react";
import type { SocialKey } from "@/lib/socials";

type IconProps = { className?: string };

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.5 2h-2.9v13.2a2.6 2.6 0 1 1-2.2-2.57V9.66a5.72 5.72 0 1 0 5.1 5.68V8.9a6.7 6.7 0 0 0 3.9 1.25V7.24A3.9 3.9 0 0 1 16.5 2z" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2A9.9 9.9 0 0 0 2.15 11.9c0 1.75.46 3.46 1.33 4.96L2.06 22l5.28-1.38a9.86 9.86 0 0 0 4.7 1.2h.01a9.9 9.9 0 0 0 9.89-9.9A9.9 9.9 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.38 8.23 8.23 0 1 1 8.24 8.25zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.78.96-.14.17-.28.19-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.19 1.1.16 1.52.1.46-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  );
}

/** Icône à utiliser pour chaque réseau. */
export const SOCIAL_ICON: Record<
  SocialKey,
  (props: IconProps) => React.ReactElement
> = {
  instagram: (p) => <Instagram className={p.className} />,
  tiktok: (p) => <TikTokIcon className={p.className} />,
  facebook: (p) => <Facebook className={p.className} />,
  whatsapp: (p) => <WhatsAppIcon className={p.className} />,
};

/**
 * Tuiles carrées arrondies — le bloc « Suivez-nous ».
 * Un réseau non renseigné en admin n'apparaît pas du tout.
 */
export function SocialTiles({
  links,
  className = "",
  variant = "dark",
}: {
  links: { key: SocialKey; label: string; href: string }[];
  className?: string;
  /** `dark` sur fond velours (bas de page), `light` sur fond papier. */
  variant?: "dark" | "light";
}) {
  if (links.length === 0) return null;

  const tile =
    variant === "dark"
      ? "bg-white/5 border-gold/25 text-gold-light hover:bg-gold/20 hover:border-gold/60"
      : "bg-emerald-deep/5 border-gold/30 text-emerald-deep hover:bg-gold/15 hover:border-gold/60";

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((l) => {
        const Icon = SOCIAL_ICON[l.key];
        return (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            aria-label={l.label}
            title={l.label}
            className={`h-12 w-12 rounded-2xl border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 ${tile}`}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}

/**
 * Rangée d'icônes rondes cliquables (footer, page contact…).
 */
export function SocialIconRow({
  links,
  className = "",
  buttonClassName = "h-10 w-10 rounded-full border border-gold/40 flex items-center justify-center text-emerald-deep hover:bg-gold/10 transition-colors",
  iconClassName = "h-4 w-4",
}: {
  links: { key: SocialKey; label: string; href: string }[];
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
}) {
  if (links.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((l) => {
        const Icon = SOCIAL_ICON[l.key];
        return (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            aria-label={l.label}
            title={l.label}
            className={buttonClassName}
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}
