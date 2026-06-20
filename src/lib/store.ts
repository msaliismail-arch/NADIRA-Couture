"use client";

import { create } from "zustand";

export type ViewName =
  | "accueil"
  | "histoire"
  | "collections"
  | "produit"
  | "sur-mesure"
  | "atelier"
  | "espace-client"
  | "contact"
  | "admin";

export type AdminSection =
  | "dashboard"
  | "produits"
  | "commandes"
  | "rendezvous"
  | "mesures"
  | "avis"
  | "galerie"
  | "contenu"
  | "artisans";

interface NavState {
  view: ViewName;
  produitSlug: string | null;
  clientCommandeRef: string | null;
  adminSection: AdminSection;
  adminAuthed: boolean;
  filters: {
    categorie: string | null;
    couleur: string | null;
    tissu: string | null;
    recherche: string;
  };
  setView: (v: ViewName) => void;
  openProduit: (slug: string) => void;
  setClientCommandeRef: (ref: string | null) => void;
  setAdminSection: (s: AdminSection) => void;
  setAdminAuthed: (v: boolean) => void;
  setFilters: (f: Partial<NavState["filters"]>) => void;
  resetFilters: () => void;
}

export const useStore = create<NavState>((set) => ({
  view: "accueil",
  produitSlug: null,
  clientCommandeRef: null,
  adminSection: "dashboard",
  adminAuthed: false,
  filters: { categorie: null, couleur: null, tissu: null, recherche: "" },
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  openProduit: (slug) => {
    set({ view: "produit", produitSlug: slug });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  setClientCommandeRef: (ref) => set({ clientCommandeRef: ref }),
  setAdminSection: (s) => set({ adminSection: s }),
  setAdminAuthed: (v) => set({ adminAuthed: v }),
  setFilters: (f) => set((st) => ({ filters: { ...st.filters, ...f } })),
  resetFilters: () =>
    set({ filters: { categorie: null, couleur: null, tissu: null, recherche: "" } }),
}));
