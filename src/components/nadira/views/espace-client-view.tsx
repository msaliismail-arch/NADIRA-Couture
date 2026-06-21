"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Package,
  Ruler,
  Calendar,
  Clock,
  Check,
  Truck,
  Scissors,
  Phone,
  ArrowRight,
  ChevronRight,
  MessageCircle,
  X,
} from "lucide-react";

import { useStore } from "@/lib/store";
import { api, formatMAD, formatDate } from "@/lib/api";
import type { Commande, Mesure, Contenu } from "@/lib/types";
import { STATUT_LABELS, STATUT_COLORS } from "@/lib/types";
import { NadiraMonogram, GoldDivider, KhatimStar } from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "en_attente", label: "En attente", icon: Clock },
  { key: "en_confection", label: "En confection", icon: Scissors },
  { key: "expediee", label: "Expédiée", icon: Truck },
  { key: "livree", label: "Livrée", icon: Check },
] as const;

const STEP_INDEX: Record<string, number> = {
  en_attente: 0,
  en_confection: 1,
  expediee: 2,
  livree: 3,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Parse photos JSON string into a list of URLs (defensive). */
function parsePhotos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
    if (typeof v === "string") return [v];
  } catch {
    // maybe a single URL string
    if (raw.startsWith("http") || raw.startsWith("/")) return [raw];
  }
  return [];
}

/** WhatsApp link from a phone number (strip spaces, country code stays). */
function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/* ------------------------------------------------------------------ */
/*  Progress Tracker — horizontal stepper                              */
/* ------------------------------------------------------------------ */

function ProgressTracker({ statut }: { statut: string }) {
  const isAnnulee = statut === "annulee";
  const currentIdx = STEP_INDEX[statut] ?? 0;

  if (isAnnulee) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50/60 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-rose-400 bg-rose-100 text-rose-600">
            <X className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg text-rose-800">
              Commande annulée
            </p>
            <p className="text-sm text-rose-700/80">
              Cette commande a été annulée. Pour toute question, contactez
              l&apos;atelier.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/30 bg-ivory-warm/60 px-4 py-6 sm:px-6">
      <div className="relative">
        {/* Background connecting line — full width, light gray */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" aria-hidden />
        {/* Gold progress line — fills up to current step */}
        <div
          className="absolute left-0 top-5 h-0.5 bg-gradient-to-r from-gold-deep via-gold to-gold-light transition-all duration-700"
          style={{
            width:
              currentIdx === 0
                ? "0%"
                : `calc((100% / 3) * ${currentIdx})`,
          }}
          aria-hidden
        />
        <ol className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const completed = idx < currentIdx;
            const current = idx === currentIdx;
            const Icon = step.icon;
            const stateClass = completed
              ? "border-gold bg-gold text-emerald-deep shadow-[0_0_0_4px_rgba(201,162,75,0.15)]"
              : current
                ? "border-gold bg-ivory text-gold-deep shadow-[0_0_0_4px_rgba(201,162,75,0.22)]"
                : "border-border bg-ivory text-muted-foreground";
            const labelClass = completed
              ? "text-emerald-deep"
              : current
                ? "text-gold-deep font-semibold"
                : "text-muted-foreground";
            return (
              <li
                key={step.key}
                className="flex w-1/4 flex-col items-center text-center"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-ivory transition-all duration-500 ${stateClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`mt-2 text-[11px] sm:text-xs leading-tight ${labelClass}`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Order Tracking Card                                                */
/* ------------------------------------------------------------------ */

function OrderTrackingCard({
  commande,
  atelierTel,
  onExplore,
}: {
  commande: Commande;
  atelierTel: string;
  onExplore: () => void;
}) {
  const client = commande.client;
  const lignes = commande.lignes ?? [];
  const { ref, visible } = useReveal<HTMLDivElement>();
  const revealClass = visible ? "in-view" : "";

  return (
    <div
      ref={ref}
      className={`reveal ${revealClass} mt-5 rounded-xl border border-gold/30 bg-white p-5 sm:p-7 shadow-sm`}
    >
      {/* Header: reference + date + statut */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-deep">
            Commande
          </p>
          <p className="font-display text-2xl text-emerald-deep">
            {commande.reference}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(commande.dateCommande)}
          </p>
        </div>
        <Badge
          className={`shrink-0 border ${STATUT_COLORS[commande.statut] || STATUT_COLORS.en_attente} px-3 py-1 text-xs`}
        >
          {STATUT_LABELS[commande.statut] || commande.statut}
        </Badge>
      </div>

      <Separator className="my-5 bg-gold/20" />

      {/* Progress tracker */}
      <ProgressTracker statut={commande.statut} />

      {/* Order items */}
      <div className="mt-6">
        <h4 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-deep">
          <Package className="h-4 w-4 text-gold-deep" />
          Articles
        </h4>
        <ul className="space-y-3">
          {lignes.map((l, i) => {
            const photos = parsePhotos(l.produit?.photos);
            const photo = photos[0];
            return (
              <li
                key={`${l.idProduit}-${i}`}
                className="flex gap-3 rounded-lg border border-border bg-ivory-warm/40 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gold/20 bg-ivory">
                  {photo ? (
                    <img
                      src={photo}
                      alt={l.produit?.nom || "Article"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gold-deep/40">
                      <Scissors className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-serif-alt text-base font-medium text-emerald-deep">
                      {l.produit?.nom || "Article"}
                    </p>
                    <p className="font-display text-sm text-gold-deep">
                      {formatMAD((l.prixUnitaire ?? 0) * (l.quantite ?? 1))}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Qté : {l.quantite ?? 1}</span>
                    {l.taille ? <span>Taille : {l.taille}</span> : null}
                    {l.couleur ? <span>Couleur : {l.couleur}</span> : null}
                    {l.surMesure ? (
                      <Badge className="border-gold/40 bg-gold/10 text-gold-deep">
                        Sur-mesure
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    {formatMAD(l.prixUnitaire ?? 0)} / pièce
                  </p>
                </div>
              </li>
            );
          })}
          {lignes.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Aucun article associé à cette commande.
            </li>
          ) : null}
        </ul>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-ivory-warm/40 p-4">
          <h4 className="mb-3 text-xs uppercase tracking-[0.2em] text-emerald-deep">
            Récapitulatif
          </h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Montant total</dt>
              <dd className="font-display text-lg text-gold-deep">
                {formatMAD(commande.montantTotal ?? 0)}
              </dd>
            </div>
            {commande.dateRetrait ? (
              <div className="flex justify-between border-t border-gold/20 pt-2">
                <dt className="text-muted-foreground">Date de retrait</dt>
                <dd className="text-emerald-deep">
                  {formatDate(commande.dateRetrait)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-ivory-warm/40 p-4">
          <h4 className="mb-3 text-xs uppercase tracking-[0.2em] text-emerald-deep">
            Client
          </h4>
          {client ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">
                  Nom
                </dt>
                <dd className="text-emerald-deep">
                  {client.prenom} {client.nom}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground/70">
                  Téléphone
                </dt>
                <dd className="text-emerald-deep">{client.telephone}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Les coordonnées client sont conservées à l&apos;atelier.
            </p>
          )}

          {commande.notes ? (
            <div className="mt-3 border-t border-gold/20 pt-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70">
                Notes de l&apos;atelier
              </p>
              <p className="mt-1 text-sm italic text-emerald-deep/90">
                « {commande.notes} »
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Contact note + actions */}
      <div className="mt-6 rounded-lg border border-gold/20 bg-emerald/[0.04] p-4">
        <p className="text-sm text-emerald-deep">
          Pour toute question concernant cette commande, contactez notre
          atelier.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-emerald-deep hover:bg-emerald text-ivory">
            <a href={`tel:${atelierTel}`}>
              <Phone className="h-3.5 w-3.5" />
              {atelierTel}
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-gold/40 text-emerald-deep hover:bg-gold/10"
          >
            <a
              href={whatsappLink(
                atelierTel,
                `Bonjour NADIRA, je vous contacte au sujet de la commande ${commande.reference}.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          onClick={onExplore}
          variant="ghost"
          className="text-emerald-deep hover:bg-gold/10 hover:text-gold-deep"
        >
          Découvrir d&apos;autres pièces
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mesures Card                                                       */
/* ------------------------------------------------------------------ */

const MESURE_FIELDS: {
  key: keyof Pick<
    Mesure,
    | "tourPoitrine"
    | "tourTaille"
    | "tourHanches"
    | "longueurRobe"
    | "longueurManche"
    | "longueurEpaule"
    | "tourBras"
  >;
  label: string;
}[] = [
  { key: "tourPoitrine", label: "Tour de poitrine" },
  { key: "tourTaille", label: "Tour de taille" },
  { key: "tourHanches", label: "Tour de hanches" },
  { key: "longueurRobe", label: "Longueur robe" },
  { key: "longueurManche", label: "Longueur manche" },
  { key: "longueurEpaule", label: "Longueur épaule" },
  { key: "tourBras", label: "Tour de bras" },
];

function MesuresCard({
  mesures,
  onCommander,
}: {
  mesures: Mesure[];
  onCommander: () => void;
}) {
  const latest = mesures[0];
  const { ref, visible } = useReveal<HTMLDivElement>();
  const revealClass = visible ? "in-view" : "";

  return (
    <div
      ref={ref}
      className={`reveal ${revealClass} mt-5 rounded-xl border border-gold/30 bg-white p-5 sm:p-7 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-deep">
            Fiche de mesures
          </p>
          <p className="font-display text-2xl text-emerald-deep">
            {mesures.length}{" "}
            {mesures.length > 1 ? "enregistrements" : "enregistrement"}
          </p>
        </div>
        <Ruler className="h-7 w-7 text-gold-deep/70" />
      </div>

      <Separator className="my-5 bg-gold/20" />

      {latest ? (
        <>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-emerald-deep">
            Dernier relevé — {formatDate(latest.created_at)}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MESURE_FIELDS.map((f) => {
              const v = latest[f.key];
              return (
                <div
                  key={f.key}
                  className="rounded-lg border border-border bg-ivory-warm/50 px-3 py-3 text-center"
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                    {f.label}
                  </p>
                  <p className="mt-1 font-display text-xl text-emerald-deep">
                    {v != null ? v : "—"}
                    {v != null ? (
                      <span className="ml-0.5 text-xs text-gold-deep">cm</span>
                    ) : null}
                  </p>
                </div>
              );
            })}
          </div>

          {latest.notes ? (
            <div className="mt-4 rounded-lg border border-gold/20 bg-emerald/[0.04] p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70">
                Notes de l&apos;atelier
              </p>
              <p className="mt-1 text-sm italic text-emerald-deep/90">
                « {latest.notes} »
              </p>
            </div>
          ) : null}

          {mesures.length > 1 ? (
            <details className="mt-4 group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs uppercase tracking-wider text-gold-deep hover:text-gold">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                Voir les relevés précédents ({mesures.length - 1})
              </summary>
              <ul className="mt-3 space-y-2">
                {mesures.slice(1).map((m, i) => (
                  <li
                    key={m.id ?? i}
                    className="rounded-md border border-border bg-ivory-warm/30 p-3 text-xs"
                  >
                    <p className="font-medium text-emerald-deep">
                      {formatDate(m.created_at)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Poitrine {m.tourPoitrine ?? "—"} · Taille{" "}
                      {m.tourTaille ?? "—"} · Hanches {m.tourHanches ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <div className="mt-5 rounded-lg border border-emerald/15 bg-emerald/[0.03] p-3">
            <p className="text-sm italic text-emerald-deep/80">
              Ces mesures sont conservées pour faciliter vos futures commandes
              sur-mesure.
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={onCommander}
              className="bg-emerald-deep hover:bg-emerald text-ivory"
            >
              Commander une nouvelle pièce
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun relevé détaillé disponible.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search Card                                                        */
/* ------------------------------------------------------------------ */

function SearchCard({
  title,
  description,
  icon: Icon,
  inputId,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  loading,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  inputId: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="paper flex flex-col gap-4 border border-gold/25 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ivory text-gold-deep">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-xl text-emerald-deep">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Label htmlFor={inputId} className="mb-1.5 block text-xs uppercase tracking-wider text-gold-deep">
            {label}
          </Label>
          <Input
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-gold/30 bg-white/70 focus-visible:border-gold focus-visible:ring-gold/30"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !value.trim()}
          className="bg-emerald-deep text-ivory hover:bg-emerald sm:min-w-32"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ivory/40 border-t-ivory" />
              Recherche…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Rechercher
            </>
          )}
        </Button>
      </form>

      {children}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const revealClass = visible ? "in-view" : "";
  return (
    <div
      ref={ref}
      className={`reveal ${revealClass} mt-10 rounded-2xl border border-dashed border-gold/30 bg-ivory-warm/40 px-6 py-14 text-center`}
    >
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-white">
        <NadiraMonogram className="h-12 w-12" />
      </div>
      <h3 className="font-display text-2xl text-emerald-deep">
        Votre espace, à portée de main
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Entrez votre numéro de commande ou votre numéro de téléphone pour
        accéder à votre espace.
      </p>
      <GoldDivider className="opacity-60" />
      <div className="mx-auto max-w-md grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gold/20 bg-white/60 p-3 text-left">
          <p className="text-[11px] uppercase tracking-wider text-gold-deep">
            Format de référence
          </p>
          <p className="font-display text-sm text-emerald-deep">
            NAD-AAAAJJMM-XXXX
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            ex. NAD-20240115-3F7K
          </p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white/60 p-3 text-left">
          <p className="text-[11px] uppercase tracking-wider text-gold-deep">
            Téléphone
          </p>
          <p className="font-display text-sm text-emerald-deep">
            +212 6 61 23 45 67
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Celui utilisé lors de votre commande
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Help Section                                                       */
/* ------------------------------------------------------------------ */

function HelpSection({ atelierTel, atelierWhatsapp }: { atelierTel: string; atelierWhatsapp: string }) {
  const steps = [
    {
      n: "01",
      title: "Commandez en ligne",
      text: "Choisissez une pièce dans nos collections ou commandez sur-mesure.",
    },
    {
      n: "02",
      title: "Recevez votre référence",
      text: "Une référence unique vous est attribuée à la validation de la commande.",
    },
    {
      n: "03",
      title: "Suivez et retirez",
      text: "Suivez la confection en temps réel puis retirez votre pièce à l'atelier.",
    },
  ];
  return (
    <section className="velvet-deep text-ivory">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: lost reference help */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-light">
              Besoin d&apos;aide ?
            </p>
            <h3 className="mt-2 font-display text-3xl text-gold-gradient">
              Vous n&apos;avez pas votre numéro de commande ?
            </h3>
            <p className="mt-3 max-w-md text-ivory/75">
              Contactez l&apos;atelier : nous retrouverons votre commande à
              partir de votre nom et téléphone.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-gold text-emerald-deep hover:bg-gold-light"
              >
                <a href={`tel:${atelierTel}`}>
                  <Phone className="h-4 w-4" />
                  {atelierTel}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-gold/40 text-gold-light hover:bg-gold/10"
              >
                <a
                  href={whatsappLink(
                    atelierWhatsapp,
                    "Bonjour NADIRA, je n'ai pas retrouvé mon numéro de commande.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Right: how it works */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-light">
              Comment ça marche ?
            </p>
            <h3 className="mt-2 font-display text-3xl text-gold-gradient">
              Trois étapes simples
            </h3>
            <ol className="mt-5 space-y-4">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm font-display text-gold-light">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-display text-lg text-ivory">{s.title}</p>
                    <p className="text-sm text-ivory/70">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-gold-light/70">
          <KhatimStar className="h-3 w-3" />
          <span className="text-[11px] uppercase tracking-[0.3em]">
            NADIRA Couture · Atelier de Agadir
          </span>
          <KhatimStar className="h-3 w-3" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main View                                                          */
/* ------------------------------------------------------------------ */

export function EspaceClientView() {
  const { setView, clientCommandeRef, setClientCommandeRef } = useStore();

  const [refInput, setRefInput] = useState("");
  const [telInput, setTelInput] = useState("");

  const [commande, setCommande] = useState<Commande | null>(null);
  const [mesures, setMesures] = useState<Mesure[] | null>(null);

  const [loadingCommande, setLoadingCommande] = useState(false);
  const [loadingMesures, setLoadingMesures] = useState(false);

  const [errorCommande, setErrorCommande] = useState<string | null>(null);
  const [errorMesures, setErrorMesures] = useState<string | null>(null);

  const [contenu, setContenu] = useState<Record<string, string>>({});

  // Fetch contenu (atelier contact info) once on mount.
  useEffect(() => {
    api<Contenu[]>("/api/contenu")
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((c) => (map[c.cle] = c.valeur));
        setContenu(map);
      })
      .catch(() => {});
  }, []);

  const searchCommande = useCallback(async (reference: string) => {
    const ref = reference.trim();
    if (!ref) return;
    setLoadingCommande(true);
    setErrorCommande(null);
    setCommande(null);
    try {
      const data = await api<Commande>(
        `/api/commandes?reference=${encodeURIComponent(ref)}`,
      );
      setCommande(data);
    } catch {
      // API returns 404 when not found
      setErrorCommande("Aucune commande trouvée avec cette référence.");
    } finally {
      setLoadingCommande(false);
    }
  }, []);

  const searchMesures = useCallback(async (telephone: string) => {
    const tel = telephone.trim();
    if (!tel) return;
    setLoadingMesures(true);
    setErrorMesures(null);
    setMesures(null);
    try {
      const data = await api<Mesure[]>(
        `/api/mesures?telephone=${encodeURIComponent(tel)}`,
      );
      if (!Array.isArray(data) || data.length === 0) {
        setErrorMesures("Aucune mesure enregistrée pour ce numéro.");
      } else {
        setMesures(data);
      }
    } catch {
      setErrorMesures("Aucune mesure enregistrée pour ce numéro.");
    } finally {
      setLoadingMesures(false);
    }
  }, []);

  // Prefill reference + auto-search if coming from a placed order.
  useEffect(() => {
    if (clientCommandeRef) {
      setRefInput(clientCommandeRef);
      // Trigger search directly
      void searchCommande(clientCommandeRef);
      // Clear so it doesn't retrigger on view re-entry
      setClientCommandeRef(null);
    }
  }, [clientCommandeRef, searchCommande, setClientCommandeRef]);

  const atelierTel = contenu.contact_telephone || "+212 5 35 63 42 18";
  const atelierWhatsapp = contenu.contact_whatsapp || "+212 6 61 23 45 67";

  const nothingSearched =
    !commande &&
    !mesures &&
    !errorCommande &&
    !errorMesures &&
    !loadingCommande &&
    !loadingMesures;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="velvet-deep text-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40">
            <NadiraMonogram className="h-9 w-9" />
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-gold-light">
            Maison NADIRA
          </p>
          <h1 className="mt-2 font-display text-5xl text-gold-gradient sm:text-6xl">
            Espace Client
          </h1>
          <p className="mt-3 text-ivory/75 font-serif-alt text-lg">
            Suivez vos commandes et retrouvez vos mesures
          </p>
          <GoldDivider className="opacity-70" />
        </div>
      </section>

      {/* Main */}
      <main className="paper flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card A — Suivre une commande */}
            <SearchCard
              title="Suivre une commande"
              description="Saisissez votre numéro de référence pour suivre l'avancement de votre commande."
              icon={Package}
              inputId="input-reference"
              label="Numéro de commande"
              placeholder="NAD-20240115-XXXX"
              value={refInput}
              onChange={setRefInput}
              onSubmit={() => searchCommande(refInput)}
              loading={loadingCommande}
            >
              {loadingCommande ? null : errorCommande ? (
                <p className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm text-rose-700">
                  {errorCommande}
                </p>
              ) : commande ? (
                <OrderTrackingCard
                  commande={commande}
                  atelierTel={atelierTel}
                  onExplore={() => setView("collections")}
                />
              ) : null}
            </SearchCard>

            {/* Card B — Mes mesures */}
            <SearchCard
              title="Mes mesures"
              description="Saisissez votre numéro de téléphone pour retrouver vos mensurations enregistrées."
              icon={Ruler}
              inputId="input-telephone"
              label="Téléphone"
              placeholder="+212 6 61 23 45 67"
              value={telInput}
              onChange={setTelInput}
              onSubmit={() => searchMesures(telInput)}
              loading={loadingMesures}
            >
              {loadingMesures ? null : errorMesures ? (
                <p className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm text-rose-700">
                  {errorMesures}
                </p>
              ) : mesures ? (
                <MesuresCard
                  mesures={mesures}
                  onCommander={() => setView("sur-mesure")}
                />
              ) : null}
            </SearchCard>
          </div>

          {nothingSearched ? <EmptyState /> : null}
        </div>
      </main>

      <HelpSection atelierTel={atelierTel} atelierWhatsapp={atelierWhatsapp} />
    </div>
  );
}
