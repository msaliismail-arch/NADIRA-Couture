/**
 * NADIRA Couture — Réseaux sociaux.
 *
 * Source unique de vérité pour les liens sociaux du site.
 * Les valeurs sont stockées dans la table `Contenu` (clés `reseaux_*`)
 * et modifiables depuis Admin → Contenu → Réseaux sociaux.
 *
 * L'admin peut saisir soit une URL complète, soit un simple pseudo
 * (@nadira) ; pour WhatsApp, un numéro de téléphone suffit.
 */

export type SocialKey = "instagram" | "tiktok" | "facebook" | "whatsapp";

/** Ordre d'affichage sur le site public. */
export const SOCIAL_KEYS: SocialKey[] = [
  "instagram",
  "tiktok",
  "facebook",
  "whatsapp",
];

/** Clé `Contenu.cle` correspondant à chaque réseau. */
export const SOCIAL_CONTENT_KEY: Record<SocialKey, string> = {
  instagram: "reseaux_instagram",
  tiktok: "reseaux_tiktok",
  facebook: "reseaux_facebook",
  whatsapp: "reseaux_whatsapp",
};

export const SOCIAL_LABEL: Record<SocialKey, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

/** Aide affichée dans le formulaire admin. */
export const SOCIAL_PLACEHOLDER: Record<SocialKey, string> = {
  instagram: "https://www.instagram.com/couture_nadira  ou  @couture_nadira",
  tiktok: "https://www.tiktok.com/@couture_nadira  ou  @couture_nadira",
  facebook: "https://www.facebook.com/couture.nadira  ou  couture.nadira",
  whatsapp: "+212 6 61 23 45 67  ou  https://wa.me/212661234567",
};

export const SOCIAL_HINT: Record<SocialKey, string> = {
  instagram: "URL complète du profil, ou simplement le pseudo.",
  tiktok: "URL complète du profil, ou simplement le pseudo.",
  facebook: "URL complète de la page, ou simplement son identifiant.",
  whatsapp:
    "Numéro de téléphone (indicatif marocain ajouté automatiquement) ou lien wa.me.",
};

/** Toutes les clés de contenu liées aux réseaux sociaux. */
export const SOCIAL_KEYS_CONTENU: string[] = SOCIAL_KEYS.map(
  (k) => SOCIAL_CONTENT_KEY[k]
);

/**
 * Transforme un numéro marocain/international en identifiant wa.me.
 * "06 61 23 45 67" → "212661234567" ; "+212 6 61 ..." → "212661234567".
 */
function whatsappDigits(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  let n = digits.replace(/^\+/, "");
  if (n.startsWith("00")) n = n.slice(2);
  // Numéro national marocain (0XXXXXXXXX) → 212XXXXXXXXX
  if (n.startsWith("0")) n = "212" + n.slice(1);
  // Numéro sans indicatif (6XXXXXXXX / 5XXXXXXXX / 7XXXXXXXX)
  if (/^[567]\d{8}$/.test(n)) n = "212" + n;
  return n.length >= 8 ? n : null;
}

/**
 * Normalise la valeur saisie en admin vers une URL cliquable.
 * Retourne `null` si le champ est vide ou inexploitable.
 */
export function normalizeSocialUrl(
  key: SocialKey,
  raw: string | undefined | null
): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (key === "whatsapp") {
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(wa\.me|api\.whatsapp\.com)/i.test(value)) return `https://${value}`;
    const n = whatsappDigits(value);
    return n ? `https://wa.me/${n}` : null;
  }

  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;

  const handle = value.replace(/^@/, "").replace(/^\/+/, "");
  if (!handle) return null;

  switch (key) {
    case "instagram":
      return `https://www.instagram.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "facebook":
      return `https://www.facebook.com/${handle}`;
    default:
      return null;
  }
}

export type SocialLink = {
  key: SocialKey;
  label: string;
  href: string;
  /** Valeur lisible (pseudo ou numéro) à afficher à côté de l'icône. */
  display: string;
};

/** Libellé court affiché dans les listes (pseudo, numéro…). */
function displayValue(key: SocialKey, raw: string, href: string): string {
  const value = raw.trim();
  if (key === "whatsapp") {
    if (/^https?:\/\//i.test(value)) {
      const n = href.split("/").pop() || "";
      return n ? `+${n}` : "WhatsApp";
    }
    return value;
  }
  if (/^https?:\/\//i.test(value) || /^www\./i.test(value)) {
    try {
      const path = new URL(href).pathname.replace(/\/+$/, "").replace(/^\//, "");
      return path ? `@${path.replace(/^@/, "").split("/")[0]}` : SOCIAL_LABEL[key];
    } catch {
      return SOCIAL_LABEL[key];
    }
  }
  return value.startsWith("@") ? value : `@${value}`;
}

/**
 * Construit la liste des réseaux à afficher, à partir de la map `contenu`.
 * Seuls les réseaux réellement renseignés en admin sont retournés.
 */
export function getSocialLinks(
  contenu: Record<string, string>
): SocialLink[] {
  const links: SocialLink[] = [];
  for (const key of SOCIAL_KEYS) {
    const raw = contenu[SOCIAL_CONTENT_KEY[key]];
    const href = normalizeSocialUrl(key, raw);
    if (!href) continue;
    links.push({
      key,
      label: SOCIAL_LABEL[key],
      href,
      display: displayValue(key, raw, href),
    });
  }
  return links;
}
