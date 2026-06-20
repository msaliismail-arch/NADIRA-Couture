"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { api, formatMAD } from "@/lib/api";
import type { Produit, Categorie, Artisan } from "@/lib/types";
import { NadiraMonogram, GoldDivider, KhatimStar } from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Ruler,
  Scissors,
  ShoppingBag,
  Truck,
  Calendar,
  ZoomIn,
} from "lucide-react";

/** Couleur → hex (NADIRA palette + extensions courantes). */
const COLOR_HEX: Record<string, string> = {
  "émeraude": "#0E3B2E",
  "emeraude": "#0E3B2E",
  "bordeaux": "#7A1F1F",
  "bleu nuit": "#1B2845",
  "or": "#C9A24B",
  "ivoire": "#F4EDE0",
  "champagne": "#E5D5B7",
  "écru": "#E8DFC8",
  "ecru": "#E8DFC8",
  "sable": "#D4C4A0",
  "terracotta": "#C66B3D",
  "vert": "#2D5F3F",
  "rose poudré": "#E8C4C4",
  "rose poudre": "#E8C4C4",
  "nacre": "#F2EEE5",
  "argent": "#C0C0C0",
  "blush": "#F4D4D4",
  "bleu": "#3B5998",
  "anthracite": "#2C2C2C",
  "noir": "#1A1A1A",
  "vert sapin": "#2C4A3A",
};

function colorHex(name: string): string {
  const key = name.trim().toLowerCase();
  return COLOR_HEX[key] ?? "#9C9078";
}

/** The product's artisans property is shaped by Prisma include:
 * { artisans: [{ idProduit, idArtisan, artisan: Artisan }] }
 * We flatten to Artisan[] here.
 */
type ProduitDetail = Produit & {
  artisans?: { artisan: Artisan }[];
};

export function ProduitView() {
  const { produitSlug, setView } = useStore();

  // Redirect to collections if no slug
  useEffect(() => {
    if (!produitSlug) {
      setView("collections");
    }
  }, [produitSlug, setView]);

  if (!produitSlug) return null;

  // `key` ensures fresh state on every slug change — no synchronous
  // setState-in-effect needed for resetting loading/error/etc.
  return <ProduitViewInner key={produitSlug} slug={produitSlug} />;
}

function ProduitViewInner({ slug }: { slug: string }) {
  const { setView, openProduit } = useStore();

  const [produit, setProduit] = useState<ProduitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [related, setRelated] = useState<Produit[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const [activePhoto, setActivePhoto] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [surMesure, setSurMesure] = useState(false);
  const [qty, setQty] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);

  const { ref: sectionRef, visible: sectionVisible } = useReveal<HTMLDivElement>();

  // Fetch product detail (initial mount only — keyed by slug)
  useEffect(() => {
    let cancelled = false;
    api<ProduitDetail>(`/api/produits/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (cancelled) return;
        setProduit(data);
        const colors = parseCouleurs(data.couleurs);
        setSelectedColor(colors[0] ?? "");
        setLoading(false);
        // Fetch related
        if (data.categorie?.slug) {
          setRelatedLoading(true);
          api<Produit[]>(
            `/api/produits?categorie=${encodeURIComponent(data.categorie.slug)}`
          )
            .then((items) =>
              setRelated(items.filter((p) => p.id !== data.id).slice(0, 4))
            )
            .catch(() => setRelated([]))
            .finally(() => setRelatedLoading(false));
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Produit introuvable");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen paper">
      {/* Breadcrumb */}
      <div className="border-b border-gold/15 bg-ivory-warm/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb
            items={[
              { label: "Accueil", onClick: () => setView("accueil") },
              { label: "Collections", onClick: () => setView("collections") },
              {
                label: produit?.categorie?.libelle ?? "Catégorie",
                onClick: () => {
                  useStore.getState().setFilters({
                    categorie: produit?.categorie?.slug ?? null,
                  });
                  setView("collections");
                },
              },
              { label: produit?.nom ?? "Pièce" },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <DetailSkeleton />
      ) : error || !produit ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <KhatimStar className="h-16 w-16 text-gold/40 mx-auto mb-6" />
          <h2 className="font-display text-2xl text-emerald-deep mb-3">
            {error || "Pièce introuvable"}
          </h2>
          <Button
            onClick={() => setView("collections")}
            className="rounded-full bg-emerald text-ivory hover:bg-emerald-soft"
          >
            Retour aux collections
          </Button>
        </div>
      ) : (
        <>
          {/* Two-column layout */}
          <section
            ref={sectionRef}
            className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 reveal ${
              sectionVisible ? "in-view" : ""
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* LEFT — Gallery */}
              <Gallery
                photos={parsePhotos(produit.photos)}
                activePhoto={activePhoto}
                setActivePhoto={setActivePhoto}
                alt={produit.nom}
              />

              {/* RIGHT — Info */}
              <div className="flex flex-col">
                {produit.categorie && (
                  <p className="text-xs uppercase tracking-[0.25em] text-gold-deep mb-3">
                    {produit.categorie.libelle}
                  </p>
                )}
                <h1 className="font-display text-4xl lg:text-5xl text-emerald-deep leading-tight mb-3">
                  {produit.nom}
                </h1>
                <p className="font-display text-3xl text-gold-deep mb-1">
                  {formatMAD(produit.prix)}
                </p>
                {produit.occasion && (
                  <p className="text-sm text-muted-foreground italic mb-4">
                    Pour {produit.occasion.toLowerCase()}
                  </p>
                )}

                <GoldDivider className="!justify-start opacity-70 my-2" />

                <p className="text-foreground/80 leading-relaxed text-[15px] mb-6">
                  {produit.description}
                </p>

                {/* Fabric + delay + stock */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <DetailLine label="Tissu" value={produit.tissu} />
                  <DetailLine
                    label="Délai de confection"
                    value={`${produit.delaiRealisation} jours`}
                  />
                  <DetailLine
                    label="Disponibilité"
                    value={
                      produit.stock > 0
                        ? `${produit.stock} en atelier`
                        : "Sur commande"
                    }
                  />
                  <DetailLine
                    label="Référence"
                    value={`#${produit.id.toString().padStart(4, "0")}`}
                  />
                </div>

                {/* Colors */}
                <ColorPicker
                  colors={parseCouleurs(produit.couleurs)}
                  value={selectedColor}
                  onChange={setSelectedColor}
                />

                {/* Type de commande */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold-deep mb-3">
                    Type de commande
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <TypeCard
                      active={!surMesure}
                      onClick={() => setSurMesure(false)}
                      icon={<ShoppingBag className="h-5 w-5" />}
                      label="Modèle standard"
                      hint="Depuis l'atelier"
                    />
                    <TypeCard
                      active={surMesure}
                      onClick={() => setSurMesure(true)}
                      icon={<Scissors className="h-5 w-5" />}
                      label="Sur-mesure"
                      hint="Couture à vos mesures"
                    />
                  </div>
                  {surMesure && (
                    <div className="mt-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-emerald-deep flex items-start gap-2.5">
                      <Ruler className="h-4 w-4 mt-0.5 text-gold-deep shrink-0" />
                      <div>
                        Nous vous contacterons pour vos mesures.
                        <button
                          onClick={() => setView("sur-mesure")}
                          className="ml-1 underline text-gold-deep hover:text-gold"
                        >
                          Prendre rendez-vous
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity + CTAs */}
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">
                    Quantité
                  </p>
                  <div className="flex items-center rounded-full border border-gold/30 bg-card">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="h-9 w-9 flex items-center justify-center text-emerald-deep hover:bg-gold/10 rounded-l-full"
                      aria-label="Diminuer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium text-emerald-deep">
                      {qty}
                    </span>
                    <button
                      onClick={() =>
                        setQty((q) =>
                          Math.min(produit.stock > 0 ? produit.stock : 99, q + 1)
                        )
                      }
                      className="h-9 w-9 flex items-center justify-center text-emerald-deep hover:bg-gold/10 rounded-r-full"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    onClick={() => setOrderOpen(true)}
                    className="flex-1 rounded-full bg-emerald text-ivory hover:bg-emerald-soft px-8 py-4 text-base font-display tracking-wide h-auto"
                  >
                    Commander cette pièce
                  </Button>
                  <Button
                    onClick={() => setView("sur-mesure")}
                    variant="outline"
                    className="flex-1 rounded-full border-gold/50 text-emerald-deep hover:bg-gold/10 hover:text-emerald-deep px-6 py-4 h-auto"
                  >
                    <Scissors className="h-4 w-4" />
                    Sur-mesure
                  </Button>
                </div>

                {/* Reassurance row */}
                <div className="grid grid-cols-3 gap-3 pt-5 border-t border-gold/15">
                  <Reassurance
                    icon={<Truck className="h-5 w-5" />}
                    label="Livraison soignée"
                  />
                  <Reassurance
                    icon={<Scissors className="h-5 w-5" />}
                    label="Fait main"
                  />
                  <Reassurance
                    icon={<Calendar className="h-5 w-5" />}
                    label={`Délai : ${produit.delaiRealisation} j`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Artisans section */}
          {produit.artisans && produit.artisans.length > 0 && (
            <section className="velvet-deep text-ivory py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold-light mb-2">
                    Savoir-faire
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl text-gold-gradient">
                    Réalisé par
                  </h2>
                  <GoldDivider className="opacity-70" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {produit.artisans.map(({ artisan }) => (
                    <div
                      key={artisan.id}
                      className="velvet rounded-lg border border-gold/25 p-5 flex items-start gap-4"
                    >
                      <div className="h-12 w-12 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
                        <KhatimStar className="h-6 w-6 text-gold-light" />
                      </div>
                      <div>
                        <p className="font-display text-lg text-gold-light leading-tight">
                          {artisan.nom}
                        </p>
                        <p className="text-xs uppercase tracking-wider text-ivory/60 mt-1">
                          {artisan.specialite}
                        </p>
                        {artisan.biographie && (
                          <p className="text-sm text-ivory/75 mt-2 leading-relaxed line-clamp-3">
                            {artisan.biographie}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <section className="paper py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold-deep mb-2">
                    À découvrir
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl text-emerald-deep">
                    Vous aimerez aussi
                  </h2>
                  <GoldDivider className="opacity-70" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {related.map((p) => (
                    <RelatedCard
                      key={p.id}
                      produit={p}
                      onClick={() => openProduit(p.slug)}
                    />
                  ))}
                </div>
                {relatedLoading && related.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">
                    Chargement des suggestions...
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Order modal */}
          <OrderDialog
            open={orderOpen}
            onOpenChange={setOrderOpen}
            produit={produit}
            qty={qty}
            surMesure={surMesure}
            selectedColor={selectedColor}
          />
        </>
      )}
    </div>
  );
}

/* =================== Sub-components =================== */

function Breadcrumb({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <nav className="flex items-center gap-1.5 text-xs tracking-wider text-muted-foreground flex-wrap">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.onClick ? (
            <button
              onClick={it.onClick}
              className="uppercase hover:text-gold-deep transition-colors"
            >
              {it.label}
            </button>
          ) : (
            <span className="uppercase text-emerald-deep truncate max-w-[160px]">
              {it.label}
            </span>
          )}
          {i < items.length - 1 && (
            <ChevronRight className="h-3 w-3 text-gold/50" />
          )}
        </span>
      ))}
    </nav>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm text-emerald-deep font-medium">{value}</p>
    </div>
  );
}

function Reassurance({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <span className="text-gold-deep">{icon}</span>
      <span className="text-[11px] tracking-wider uppercase text-muted-foreground leading-tight">
        {label}
      </span>
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left rounded-lg border p-4 transition-all ${
        active
          ? "border-emerald bg-emerald/5 ring-1 ring-emerald/30"
          : "border-gold/25 hover:border-gold/50 bg-card/40"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <span className={active ? "text-emerald" : "text-gold-deep"}>
          {icon}
        </span>
        <span className="font-display text-base text-emerald-deep">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {active && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-emerald text-ivory flex items-center justify-center">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

function ColorPicker({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  if (colors.length === 0) return null;
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-deep mb-3">
        Couleur{colors.length > 1 ? "s" : ""} disponible{colors.length > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {colors.map((c) => {
          const hex = colorHex(c);
          const selected = value === c;
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              className="group flex flex-col items-center gap-1.5"
              title={c}
              aria-label={`Couleur ${c}`}
            >
              <span
                className={`h-9 w-9 rounded-full border-2 transition-all ${
                  selected
                    ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory-warm border-ivory"
                    : "border-gold/30 group-hover:border-gold/60"
                }`}
                style={{ backgroundColor: hex }}
              />
              <span
                className={`text-[10px] tracking-wide capitalize transition-colors ${
                  selected
                    ? "text-emerald-deep font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Gallery({
  photos,
  activePhoto,
  setActivePhoto,
  alt,
}: {
  photos: string[];
  activePhoto: number;
  setActivePhoto: (i: number) => void;
  alt: string;
}) {
  const [zoom, setZoom] = useState(false);
  const safePhotos = photos.length > 0 ? photos : ["/images/placeholder.jpg"];
  const main = safePhotos[Math.min(activePhoto, safePhotos.length - 1)];

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
      <div
        className="relative overflow-hidden rounded-lg gold-border aspect-[3/4] bg-muted group"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
      >
        <img
          src={main}
          alt={alt}
          className={`h-full w-full object-cover transition-transform duration-700 ${
            zoom ? "scale-110" : "scale-100"
          }`}
        />
        <div className="absolute top-3 right-3 h-9 w-9 rounded-full bg-ivory/85 backdrop-blur-sm flex items-center justify-center text-emerald-deep shadow-md">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>

      {safePhotos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {safePhotos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                i === activePhoto
                  ? "border-gold"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={p}
                alt={`${alt} ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RelatedCard({
  produit,
  onClick,
}: {
  produit: Produit;
  onClick: () => void;
}) {
  const photos = parsePhotos(produit.photos);
  const cover = photos[0] || "/images/placeholder.jpg";
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-lg gold-border aspect-[3/4] bg-muted">
        <img
          src={cover}
          alt={produit.nom}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="mt-3 px-1">
        {produit.categorie && (
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold-deep mb-1">
            {produit.categorie.libelle}
          </p>
        )}
        <h3 className="font-display text-base text-emerald-deep leading-snug mb-1 group-hover:text-emerald transition-colors">
          {produit.nom}
        </h3>
        <p className="font-display text-base text-gold-deep">
          {formatMAD(produit.prix)}
        </p>
      </div>
    </article>
  );
}

/* =================== Order Dialog (3-step) =================== */

type OrderForm = {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  notes: string;
};

function OrderDialog({
  open,
  onOpenChange,
  produit,
  qty,
  surMesure,
  selectedColor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  produit: Produit;
  qty: number;
  surMesure: boolean;
  selectedColor: string;
}) {
  const { setView } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OrderForm>({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    notes: "",
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setPhoneError(null);
      setSubmitError(null);
      setReference(null);
      setSubmitting(false);
    }
  }, [open]);

  const setField = (k: keyof OrderForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validatePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "Le téléphone est requis";
    if (digits.length < 8) return "Numéro de téléphone invalide";
    return null;
  };

  const goStep2 = () => {
    const err = validatePhone(form.telephone);
    setPhoneError(err);
    if (err) return;
    setStep(2);
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        email: form.email || undefined,
        notes: form.notes || undefined,
        lignes: [
          {
            idProduit: produit.id,
            quantite: qty,
            surMesure,
            couleur: selectedColor || null,
            taille: null,
          },
        ],
      };
      const res = await api<{ commande: unknown; reference: string }>(
        "/api/commandes",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      setReference(res.reference);
      setStep(3);
    } catch (e: unknown) {
      setSubmitError(
        e instanceof Error ? e.message : "Erreur lors de l'envoi de la demande"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg paper border-gold/30 max-h-[92vh] overflow-y-auto nadira-scroll">
        <DialogHeader className="sr-only">
          <DialogTitle>Commander {produit.nom}</DialogTitle>
          <DialogDescription>
            Finalisez votre demande de commande en trois étapes.
          </DialogDescription>
        </DialogHeader>

        {/* Visual title + progress bar */}
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          <NadiraMonogram className="h-10 w-10 mb-2" />
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
            {step === 3 ? "Demande envoyée" : "Votre commande"}
          </p>
          <h3 className="font-display text-2xl text-emerald-deep mt-1">
            {step === 3 ? "Merci" : produit.nom}
          </h3>
        </div>

        {step < 3 && (
          <ProgressBar step={step} />
        )}

        {/* STEP 1 — Recap */}
        {step === 1 && (
          <div className="space-y-5 px-1">
            <RecapCard
              produit={produit}
              qty={qty}
              surMesure={surMesure}
              selectedColor={selectedColor}
            />

            <Separator className="bg-gold/15" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom">
                  <Input
                    value={form.prenom}
                    onChange={(e) => setField("prenom", e.target.value)}
                    placeholder="Votre prénom"
                    className="bg-card/60 border-gold/30"
                  />
                </Field>
                <Field label="Nom">
                  <Input
                    value={form.nom}
                    onChange={(e) => setField("nom", e.target.value)}
                    placeholder="Votre nom"
                    className="bg-card/60 border-gold/30"
                  />
                </Field>
              </div>
              <Field label="Téléphone" required>
                <Input
                  value={form.telephone}
                  onChange={(e) => {
                    setField("telephone", e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="06 12 34 56 78"
                  inputMode="tel"
                  className={`bg-card/60 ${
                    phoneError
                      ? "border-destructive"
                      : "border-gold/30"
                  }`}
                />
                {phoneError && (
                  <p className="text-xs text-destructive mt-1">{phoneError}</p>
                )}
              </Field>
            </div>

            <DialogFooter className="flex-row gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1 rounded-full border-gold/40 text-emerald-deep hover:bg-gold/10"
              >
                Annuler
              </Button>
              <Button
                onClick={goStep2}
                className="flex-1 rounded-full bg-emerald text-ivory hover:bg-emerald-soft"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2 — Coordonnées / mesures */}
        {step === 2 && (
          <div className="space-y-5 px-1">
            <RecapCard
              produit={produit}
              qty={qty}
              surMesure={surMesure}
              selectedColor={selectedColor}
              compact
            />

            <Separator className="bg-gold/15" />

            <div className="space-y-4">
              <Field label="Email (optionnel)">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="vous@exemple.com"
                  className="bg-card/60 border-gold/30"
                />
              </Field>
              <Field label="Notes pour l'atelier (optionnel)">
                <Input
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Une demande particulière..."
                  className="bg-card/60 border-gold/30"
                />
              </Field>

              {surMesure && (
                <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-emerald-deep flex items-start gap-2.5">
                  <Ruler className="h-4 w-4 mt-0.5 text-gold-deep shrink-0" />
                  <div>
                    Vos mesures seront prises lors du rendez-vous à l'atelier.
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        setView("sur-mesure");
                      }}
                      className="ml-1 underline text-gold-deep hover:text-gold"
                    >
                      Réserver un créneau
                    </button>
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-destructive text-center">
                {submitError}
              </p>
            )}

            {/* No payment note */}
            <div className="rounded-lg bg-emerald-deep/5 border border-emerald/15 px-4 py-3 text-xs text-emerald-deep text-center leading-relaxed">
              Aucun paiement en ligne — le règlement se fait directement avec
              notre équipe par téléphone ou à l'atelier.
            </div>

            <DialogFooter className="flex-row gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 rounded-full border-gold/40 text-emerald-deep hover:bg-gold/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-full bg-emerald text-ivory hover:bg-emerald-soft"
              >
                {submitting ? "Envoi..." : "Envoyer ma demande"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3 — Confirmation */}
        {step === 3 && reference && (
          <div className="space-y-5 px-1 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-emerald/10 border-2 border-gold flex items-center justify-center">
                <Check className="h-9 w-9 text-emerald" />
              </div>
            </div>
            <div>
              <h4 className="font-display text-2xl text-emerald-deep mb-2">
                Votre demande a été envoyée
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Notre équipe vous contacte sous peu pour finaliser votre
                commande.
              </p>
            </div>

            <div className="rounded-lg border border-gold/30 bg-gold/5 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold-deep mb-1">
                Votre référence
              </p>
              <p className="font-display text-xl text-emerald-deep tracking-wider">
                {reference}
              </p>
            </div>

            <DialogFooter className="flex-row gap-2">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setView("collections");
                }}
                className="flex-1 rounded-full bg-emerald text-ivory hover:bg-emerald-soft"
              >
                Retour aux collections
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full transition-colors ${
              s <= step ? "bg-gold" : "bg-gold/20"
            }`}
          />
          {i < 2 && (
            <div
              className={`h-px w-10 transition-colors ${
                s < step ? "bg-gold" : "bg-gold/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RecapCard({
  produit,
  qty,
  surMesure,
  selectedColor,
  compact = false,
}: {
  produit: Produit;
  qty: number;
  surMesure: boolean;
  selectedColor: string;
  compact?: boolean;
}) {
  const photos = parsePhotos(produit.photos);
  const cover = photos[0] || "/images/placeholder.jpg";
  return (
    <div className="flex gap-3 rounded-lg border border-gold/25 bg-card/40 p-3">
      <div className="h-20 w-16 rounded-md overflow-hidden bg-muted shrink-0">
        <img src={cover} alt={produit.nom} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        {produit.categorie && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-deep">
            {produit.categorie.libelle}
          </p>
        )}
        <p className="font-display text-base text-emerald-deep leading-tight truncate">
          {produit.nom}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
          <span>Quantité : {qty}</span>
          {selectedColor && <span>Couleur : <span className="capitalize">{selectedColor}</span></span>}
          <span>{surMesure ? "Sur-mesure" : "Standard"}</span>
        </div>
        {!compact && (
          <p className="font-display text-base text-gold-deep mt-1">
            {formatMAD(produit.prix * qty)}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.18em] text-gold-deep">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

/* =================== Helpers =================== */

function parsePhotos(photos: string | null | undefined): string[] {
  if (!photos) return [];
  return photos
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCouleurs(couleurs: string | null | undefined): string[] {
  if (!couleurs) return [];
  return couleurs
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* =================== Skeleton =================== */

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-[3/4] rounded-lg bg-muted" />
          <div className="grid grid-cols-5 gap-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-muted" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-1/4 bg-muted rounded" />
          <div className="h-12 w-3/4 bg-muted rounded" />
          <div className="h-8 w-1/3 bg-muted rounded" />
          <div className="h-px w-full bg-muted my-4" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
            <div className="h-3 w-4/6 bg-muted rounded" />
          </div>
          <div className="h-10 w-full bg-muted rounded-full" />
          <div className="h-10 w-full bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}
