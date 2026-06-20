"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { api, formatMAD } from "@/lib/api";
import type { Produit, Categorie } from "@/lib/types";
import { GoldDivider, KhatimStar } from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Filter, Search, X, ChevronRight, ArrowRight } from "lucide-react";

const TISSUS = [
  "Velours",
  "Soie naturelle",
  "Lin",
  "Crêpe",
  "Satin broché",
  "Mousseline",
  "Métal ciselé",
  "Fil d'or",
];

export function CollectionsView() {
  const { filters, setFilters, resetFilters, openProduit, setView } = useStore();

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination: show products in batches to avoid rendering everything at once
  const PAGE_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Sheet local state (drafts filters; commits on Apply)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftTissu, setDraftTissu] = useState<string>(filters.tissu ?? "");
  const [draftCouleur, setDraftCouleur] = useState<string>(filters.couleur ?? "");
  const [draftPrixMin, setDraftPrixMin] = useState<string>("");
  const [draftPrixMax, setDraftPrixMax] = useState<string>("");

  const reveal = useReveal<HTMLDivElement>();
  const { ref: gridRef, visible: gridVisible } = reveal;

  // Fetch categories once
  useEffect(() => {
    api<Categorie[]>("/api/categories")
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  // Fetch produits whenever filters change.
  // State resets are deferred to a microtask to avoid cascading renders
  // (setState synchronously inside an effect body is flagged by the lint rule).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setVisibleCount(PAGE_SIZE); // Reset pagination when filters change
    });
    const params = new URLSearchParams();
    if (filters.categorie) params.set("categorie", filters.categorie);
    if (filters.recherche) params.set("recherche", filters.recherche);
    if (filters.couleur) params.set("couleur", filters.couleur);
    if (filters.tissu) params.set("tissu", filters.tissu);
    const qs = params.toString() ? `?${params.toString()}` : "";
    api<Produit[]>(`/api/produits${qs}`)
      .then((data) => {
        if (cancelled) return;
        setProduits(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur de chargement");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  // Client-side price filtering (price isn't in API; we filter what came back)
  const filteredProduits = useMemo(() => {
    return produits.filter((p) => {
      if (draftPrixMin && p.prix < Number(draftPrixMin)) return false;
      if (draftPrixMax && p.prix > Number(draftPrixMax)) return false;
      return true;
    });
  }, [produits, draftPrixMin, draftPrixMax]);

  const openSheet = () => {
    setDraftTissu(filters.tissu ?? "");
    setDraftCouleur(filters.couleur ?? "");
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setFilters({
      tissu: draftTissu || null,
      couleur: draftCouleur || null,
    });
    setSheetOpen(false);
  };

  const resetAll = () => {
    resetFilters();
    setDraftTissu("");
    setDraftCouleur("");
    setDraftPrixMin("");
    setDraftPrixMax("");
    setSheetOpen(false);
  };

  const activeFilterCount =
    (filters.tissu ? 1 : 0) + (filters.couleur ? 1 : 0) + (draftPrixMin ? 1 : 0) + (draftPrixMax ? 1 : 0);

  return (
    <div className="min-h-screen">
      {/* Header band */}
      <section className="velvet-deep text-ivory py-16 sm:py-20 relative overflow-hidden">
        <KhatimStar className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 text-gold/10 khatim-spin" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs tracking-wider text-ivory/60 mb-6">
            <button
              onClick={() => setView("accueil")}
              className="hover:text-gold-light transition-colors uppercase"
            >
              Accueil
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gold-light uppercase">Collections</span>
          </nav>

          <h1 className="font-display text-5xl sm:text-6xl text-gold-gradient mb-4">
            Collections
          </h1>
          <p className="text-ivory/75 max-w-2xl text-lg leading-relaxed">
            Caftans, takchitas, djellabas et accessoires — façonnés main à Fès
          </p>
          <GoldDivider className="!justify-start opacity-70" />
        </div>
      </section>

      {/* Filters bar */}
      <div className="sticky top-16 sm:top-20 z-30 paper border-b border-gold/20 backdrop-blur-md bg-ivory-warm/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Category pills */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto nadira-scroll pb-1 lg:pb-0">
              <CategoryPill
                active={!filters.categorie}
                onClick={() => setFilters({ categorie: null })}
              >
                Tout
              </CategoryPill>
              {categories.map((c) => (
                <CategoryPill
                  key={c.id}
                  active={filters.categorie === c.slug}
                  onClick={() => setFilters({ categorie: c.slug })}
                >
                  {c.libelle}
                </CategoryPill>
              ))}
            </div>

            {/* Search input */}
            <div className="relative flex-shrink-0 w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={filters.recherche}
                onChange={(e) => setFilters({ recherche: e.target.value })}
                placeholder="Rechercher..."
                className="pl-9 pr-8 bg-card/60 border-gold/30 focus-visible:border-gold rounded-full"
              />
              {filters.recherche && (
                <button
                  onClick={() => setFilters({ recherche: "" })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={openSheet}
                  variant="outline"
                  className="rounded-full border-gold/40 text-emerald-deep hover:bg-gold/10 hover:text-emerald-deep shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <span className="ml-1 h-5 w-5 rounded-full bg-emerald text-ivory text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:max-w-md paper border-l-gold/30 flex flex-col"
              >
                <SheetHeader className="border-b border-gold/20 pb-4">
                  <SheetTitle className="font-display text-2xl text-emerald-deep">
                    Filtres
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Affinez votre recherche parmi nos pièces
                  </p>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto nadira-scroll px-4 py-6 space-y-7">
                  {/* Tissu */}
                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-[0.2em] text-gold-deep">
                      Tissu
                    </Label>
                    <Select value={draftTissu} onValueChange={setDraftTissu}>
                      <SelectTrigger className="w-full bg-card/60 border-gold/30">
                        <SelectValue placeholder="Tous les tissus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les tissus</SelectItem>
                        {TISSUS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Couleur */}
                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-[0.2em] text-gold-deep">
                      Couleur
                    </Label>
                    <Input
                      value={draftCouleur}
                      onChange={(e) => setDraftCouleur(e.target.value)}
                      placeholder="Ex : émeraude, or, ivoire..."
                      className="bg-card/60 border-gold/30"
                    />
                  </div>

                  {/* Prix */}
                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-[0.2em] text-gold-deep">
                      Prix (MAD)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={draftPrixMin}
                        onChange={(e) => setDraftPrixMin(e.target.value)}
                        placeholder="Min"
                        className="bg-card/60 border-gold/30"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        min={0}
                        value={draftPrixMax}
                        onChange={(e) => setDraftPrixMax(e.target.value)}
                        placeholder="Max"
                        className="bg-card/60 border-gold/30"
                      />
                    </div>
                  </div>

                  {/* Category quick-set */}
                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-[0.2em] text-gold-deep">
                      Catégorie
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilters({ categorie: null })}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          !filters.categorie
                            ? "bg-emerald text-ivory border-emerald"
                            : "border-gold/30 text-emerald-deep hover:bg-gold/10"
                        }`}
                      >
                        Tout
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setFilters({ categorie: c.slug })}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            filters.categorie === c.slug
                              ? "bg-emerald text-ivory border-emerald"
                              : "border-gold/30 text-emerald-deep hover:bg-gold/10"
                          }`}
                        >
                          {c.libelle}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <SheetFooter className="border-t border-gold/20 pt-4 flex-row gap-2">
                  <Button
                    onClick={resetAll}
                    variant="outline"
                    className="flex-1 rounded-full border-gold/40 text-emerald-deep hover:bg-gold/10"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={applyFilters}
                    className="flex-1 rounded-full bg-emerald text-ivory hover:bg-emerald-soft"
                  >
                    Appliquer
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Result count */}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <KhatimStar className="h-3 w-3 text-gold/60" />
            <span className="tracking-wider uppercase">
              {loading
                ? "Chargement..."
                : `${filteredProduits.length} ${
                    filteredProduits.length > 1 ? "pièces" : "pièce"
                  }`}
            </span>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <section className="paper py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error ? (
            <EmptyState
              title="Une erreur est survenue"
              message={error}
              onReset={resetAll}
            />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProduits.length === 0 ? (
            <EmptyState
              title="Aucune pièce ne correspond à votre recherche"
              message="Essayez d'élargir vos critères ou réinitialisez les filtres pour découvrir toute la collection."
              onReset={resetAll}
            />
          ) : (
            <>
              <div
                ref={gridRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredProduits.slice(0, visibleCount).map((p, idx) => (
                  <ProductCard
                    key={p.id}
                    produit={p}
                    onClick={() => openProduit(p.slug)}
                    delay={idx * 60}
                    visible={gridVisible}
                  />
                ))}
              </div>
              {/* Load More button */}
              {filteredProduits.length > visibleCount && (
                <div className="flex flex-col items-center mt-12">
                  <button
                    onClick={() =>
                      setVisibleCount((c) => c + PAGE_SIZE)
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-8 py-3 text-sm uppercase tracking-[0.2em] text-emerald-deep hover:bg-gold/15 hover:border-gold/60 transition-colors"
                  >
                    Charger plus
                    <span className="text-xs text-muted-foreground normal-case tracking-normal">
                      ({filteredProduits.length - visibleCount} restantes)
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm tracking-wide transition-all whitespace-nowrap ${
        active
          ? "bg-emerald text-ivory shadow-sm shadow-emerald/30"
          : "bg-card/60 text-emerald-deep border border-gold/25 hover:border-gold/60 hover:bg-gold/10"
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({
  produit,
  onClick,
  delay,
  visible,
}: {
  produit: Produit;
  onClick: () => void;
  delay: number;
  visible: boolean;
}) {
  const photos = produit.photos
    ? produit.photos.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const cover = photos[0] || "/images/placeholder.jpg";

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer"
      style={{
        animation: "fade-up 0.6s ease forwards",
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div className="relative overflow-hidden rounded-lg gold-border aspect-[3/4] bg-muted">
        {/* Use next/image is preferred but img works too */}
        <img
          src={cover}
          alt={produit.nom}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/85 via-emerald-deep/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* "Voir la pièce" button */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <div className="inline-flex items-center gap-2 rounded-full bg-ivory/95 px-4 py-2 text-xs uppercase tracking-[0.18em] text-emerald-deep shadow-lg">
            Voir la pièce
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Vedette badge */}
        {produit.vedette && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-gold/95 text-emerald-deep border-0 hover:bg-gold">
              Vedette
            </Badge>
          </div>
        )}
        {produit.stock <= 0 && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className="bg-ivory/90 text-emerald-deep border-gold/40"
            >
              Sur commande
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-4 px-1">
        {produit.categorie && (
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-1.5">
            {produit.categorie.libelle}
          </p>
        )}
        <h3 className="font-display text-lg text-emerald-deep leading-snug mb-1 group-hover:text-emerald transition-colors">
          {produit.nom}
        </h3>
        <p className="text-xs text-muted-foreground mb-2 italic">
          {produit.tissu}
        </p>
        <p className="font-display text-xl text-gold-deep">
          {formatMAD(produit.prix)}
        </p>
      </div>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-lg bg-muted" />
      <div className="mt-4 space-y-2 px-1">
        <div className="h-3 w-1/3 bg-muted rounded" />
        <div className="h-5 w-2/3 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
    </div>
  );
}

function EmptyState({
  title,
  message,
  onReset,
}: {
  title: string;
  message: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <KhatimStar className="h-16 w-16 text-gold/40 mb-6" />
      <h3 className="font-display text-2xl text-emerald-deep mb-3">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      <Button
        onClick={onReset}
        className="rounded-full bg-emerald text-ivory hover:bg-emerald-soft px-6"
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );
}
