"use client";

/**
 * NADIRA Couture — Aperçu de carte.
 *
 * Affiche une vraie carte Google Maps de l'adresse de l'atelier, avec :
 *  - un bouton « Maps » qui ouvre l'adresse dans Google Maps,
 *  - un lien « Voir l'itinéraire » qui lance la navigation.
 *
 * L'adresse vient de Admin → Contenu → Coordonnées de la maison.
 * Aucune clé d'API n'est nécessaire.
 */

import { ExternalLink, Navigation } from "lucide-react";
import { mapsEmbedUrl, mapsDirectionsUrl } from "@/lib/maps";

export function MapPreview({
  adresse,
  mapsLink,
  variant = "dark",
  className = "",
  height = "h-48",
}: {
  adresse: string;
  /** Lien « Maps ». Par défaut : recherche Google Maps sur l'adresse. */
  mapsLink: string;
  /** `dark` sur fond velours (bas de page), `light` sur fond papier. */
  variant?: "dark" | "light";
  className?: string;
  /** Classe Tailwind de hauteur, ex. `h-48`, `h-72`. */
  height?: string;
}) {
  const isDark = variant === "dark";

  return (
    <div className={className}>
      <div
        className={`relative overflow-hidden rounded-2xl border ${
          isDark ? "border-gold/25" : "border-gold/30"
        }`}
      >
        <iframe
          src={mapsEmbedUrl(adresse)}
          title={`Carte — ${adresse}`}
          className={`w-full ${height} border-0 block`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        {/* Bouton « Maps » en surimpression */}
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          title={`Ouvrir « ${adresse} » dans Google Maps`}
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-emerald-deep shadow-md backdrop-blur hover:bg-white transition-colors"
        >
          Maps
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Lien itinéraire */}
      <a
        href={mapsDirectionsUrl(adresse)}
        target="_blank"
        rel="noreferrer"
        className={`mt-3 inline-flex items-center gap-2 text-sm transition-colors ${
          isDark
            ? "text-gold-light hover:text-gold"
            : "text-emerald-deep hover:text-gold-deep"
        }`}
      >
        <Navigation className="h-4 w-4" />
        Voir l&apos;itinéraire
      </a>
    </div>
  );
}
