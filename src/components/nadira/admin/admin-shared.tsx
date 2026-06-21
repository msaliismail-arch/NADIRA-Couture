"use client";

/**
 * NADIRA Couture — Admin shared helpers, constants, and small UI atoms.
 * Imported by every admin section file to avoid duplication.
 */

import type { Commande } from "@/lib/types";
import { STATUT_LABELS, STATUT_COLORS } from "@/lib/types";
import type { AdminSection } from "@/lib/store";
import { normalizeImageUrl } from "@/lib/api";

// shadcn/ui
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// lucide
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Ruler,
  Star,
  FileText,
  Users,
  Images,
} from "lucide-react";

// Re-export for convenience so sections only need a single import source.
export { STATUT_LABELS, STATUT_COLORS };
export type { AdminSection };

/* ============================================================
   Constants & helpers
============================================================ */

export const TOKEN_KEY = "nadira-admin-token";
export const NAME_KEY = "nadira-admin-nom";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminName(): string {
  if (typeof window === "undefined") return "Administrateur";
  return localStorage.getItem(NAME_KEY) || "Administrateur";
}

export async function adminApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      try {
        msg = (await res.text()) || msg;
      } catch {
        /* noop */
      }
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ============================================================
   Navigation
============================================================ */

export const NAV_ITEMS: {
  key: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "produits", label: "Produits", icon: Package },
  { key: "commandes", label: "Commandes", icon: ShoppingCart },
  { key: "rendezvous", label: "Rendez-vous", icon: Calendar },
  { key: "mesures", label: "Mesures", icon: Ruler },
  { key: "avis", label: "Avis", icon: Star },
  { key: "galerie", label: "Galerie", icon: Images },
  { key: "artisans", label: "Artisans", icon: Users },
  { key: "contenu", label: "Contenu", icon: FileText },
];

/* ============================================================
   Galerie categories
============================================================ */

export const GALERIE_CATEGORIES = [
  "Atelier",
  "Coulisses",
  "Défilé",
  "Produits",
  "Autre",
] as const;

export const GALERIE_CAT_COLORS: Record<string, string> = {
  Atelier: "bg-emerald/10 text-emerald-deep border-emerald/30",
  Coulisses: "bg-amber-100 text-amber-800 border-amber-300",
  Défilé: "bg-rose-100 text-rose-800 border-rose-300",
  Produits: "bg-gold/15 text-gold-deep border-gold/30",
  Autre: "bg-muted text-muted-foreground border-border",
};

/* ============================================================
   Shared types
============================================================ */

export type Stats = {
  totalCommandes: number;
  commandesEnAttente: number;
  commandesEnConfection: number;
  commandesLivrees: number;
  totalClients: number;
  totalProduits: number;
  rdvAVenir: number;
  topProduits: {
    produit: {
      id: number;
      nom: string;
      slug: string;
      photos: string;
      prix: number;
    };
    count: number;
  }[];
  commandesParMois: { mois: string; count: number }[];
  commandesRecentes: Commande[];
};

/* ============================================================
   Small UI atoms
============================================================ */

export function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${
        STATUT_COLORS[statut] ||
        "bg-muted text-muted-foreground border-border"
      }`}
    >
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

export function ProduitThumb({
  photos,
  alt,
}: {
  photos: string;
  alt: string;
}) {
  const first = photos?.split(",")[0]?.trim();
  return (
    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted border border-border shrink-0">
      {first ? (
        <img
          src={normalizeImageUrl(first)}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Package className="w-4 h-4 m-auto mt-3 text-muted-foreground" />
      )}
    </div>
  );
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  accent = "emerald",
  badge,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: string | number;
  accent?: "emerald" | "gold";
  badge?: boolean;
}) {
  const accentBg =
    accent === "gold"
      ? "bg-gold/10 text-gold-deep"
      : "bg-emerald/10 text-emerald";
  return (
    <Card className="p-4 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentBg}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
          {label}
        </p>
        <p className="font-display text-2xl text-emerald-deep truncate flex items-center gap-2">
          {value}
          {badge && Number(value) > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] bg-destructive text-white rounded-full">
              {value}
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}

export function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <span className="font-medium text-emerald-deep">{value}</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
