/**
 * NADIRA Couture — Adresse & carte.
 *
 * L'adresse et le lien carte sont stockés dans la table `Contenu`
 * (`contact_adresse`, `contact_maps`) et modifiables depuis
 * Admin → Contenu. Si aucun lien n'est renseigné, on en génère un
 * automatiquement à partir de l'adresse.
 */

/** Adresse de l'atelier utilisée par défaut. */
export const ADRESSE_ATELIER = "26 Rue Iligh, Agadir 80000";

/** Lien Google Maps par défaut, calculé sur l'adresse de l'atelier. */
export const MAPS_URL_DEFAUT = mapsUrl(ADRESSE_ATELIER);

/**
 * Construit un lien de recherche Google Maps à partir d'une adresse.
 * Fonctionne sur mobile comme sur desktop (ouvre l'app si installée).
 */
export function mapsUrl(adresse: string): string {
  const query = encodeURIComponent(
    `${(adresse || "").trim() || ADRESSE_ATELIER}, Maroc`
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * URL d'aperçu de carte, à placer dans une iframe.
 * Utilise l'embed Google Maps, qui ne demande aucune clé d'API.
 */
export function mapsEmbedUrl(adresse: string): string {
  const query = encodeURIComponent(
    `${(adresse || "").trim() || ADRESSE_ATELIER}, Maroc`
  );
  return `https://www.google.com/maps?q=${query}&z=14&output=embed`;
}

/**
 * Lien « Voir l'itinéraire » : ouvre Google Maps en mode navigation,
 * depuis la position du visiteur jusqu'à l'atelier.
 */
export function mapsDirectionsUrl(adresse: string): string {
  const query = encodeURIComponent(
    `${(adresse || "").trim() || ADRESSE_ATELIER}, Maroc`
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

/**
 * Résout l'adresse et le lien carte à afficher sur le site public.
 * - `contact_adresse` vide → adresse de l'atelier par défaut.
 * - `contact_maps` vide → lien Google Maps généré depuis l'adresse.
 */
export function getAdresse(contenu: Record<string, string>): {
  adresse: string;
  mapsLink: string;
} {
  const adresse = (contenu.contact_adresse || "").trim() || ADRESSE_ATELIER;
  const mapsLink = (contenu.contact_maps || "").trim() || mapsUrl(adresse);
  return { adresse, mapsLink };
}
