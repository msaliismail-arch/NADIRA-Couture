/**
 * Lightweight API client for NADIRA views.
 * All fetches use relative paths (Caddy gateway handles routing).
 */

export async function api<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store", // Always fetch fresh data — no ghost/cached products after delete
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Normalize an image URL so uploaded images are always served through
 * the reliable API route (bypasses Next.js static file serving issues
 * in dev mode for newly created files).
 * - /uploads/xxx.jpg  → /api/uploads/xxx.jpg
 * - /api/uploads/xxx.jpg → unchanged
 * - /images/xxx.jpg → unchanged (static, existed at server start)
 * - https://... → unchanged (external URLs)
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/uploads/")) {
    return `/api/uploads/${url.slice("/uploads/".length)}`;
  }
  return url;
}

export const formatMAD = (n: number) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatDateTime = (d: string | Date) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
