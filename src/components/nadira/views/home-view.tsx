"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { api, formatMAD, normalizeImageUrl } from "@/lib/api";
import type { Produit, Avis } from "@/lib/types";
import {
  NadiraMonogram,
  NadiraMedallion,
  KhatimStar,
  GoldDivider,
} from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { ArrowRight, Star, ChevronDown, Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function firstPhoto(photos: string): string {
  const p = (photos || "").split(",")[0]?.trim();
  return normalizeImageUrl(p || "/images/caftan-zellige.jpg");
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${visible ? "reveal in-view" : "reveal"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main view                                                          */
/* ------------------------------------------------------------------ */

export function HomeView({ contenu }: { contenu: Record<string, string> }) {
  const { setView, openProduit } = useStore();
  const [vedettes, setVedettes] = useState<Produit[] | null>(null);
  const [avis, setAvis] = useState<Avis[] | null>(null);

  useEffect(() => {
    api<Produit[]>("/api/produits?vedette=true")
      .then(setVedettes)
      .catch(() => setVedettes([]));
    api<Avis[]>("/api/avis?approuve=true")
      .then(setAvis)
      .catch(() => setAvis([]));
  }, []);

  return (
    <div>
      {/* ============================================================ */}
      {/* 1. HERO PLEIN ÉCRAN                                          */}
      {/* ============================================================ */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src={normalizeImageUrl(contenu.hero_accueil_image || "/images/hero-atelier.jpg")}
          alt="Atelier NADIRA — lumière dorée sur le velours et la soie"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Emerald velvet overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-deep/80 via-emerald-deep/70 to-emerald-deep/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-transparent to-emerald-deep/40" />

        {/* Inner golden frame */}
        <div className="pointer-events-none absolute inset-4 sm:inset-6 border border-gold/30 rounded-sm" />
        <div className="pointer-events-none absolute inset-4 sm:inset-6 border border-gold/10 rounded-sm" style={{ transform: "translate(3px, 3px)" }} />

        {/* Centered content */}
        <div className="relative z-10 px-6 text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <NadiraMonogram className="h-16 w-16 drop-shadow-[0_4px_18px_rgba(201,162,75,0.45)]" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl tracking-[0.3em] text-gold-gradient mb-7">
            NADIRA
          </h1>

          <div className="flex items-center justify-center gap-3 mb-7">
            <span className="h-px w-10 bg-gold/60" />
            <KhatimStar className="h-3.5 w-3.5 text-gold/80" />
            <span className="h-px w-10 bg-gold/60" />
          </div>

          <p className="font-display text-2xl sm:text-4xl text-ivory leading-relaxed max-w-2xl mx-auto">
            {contenu.hero_accroche || "L'art de la couture marocaine, façonné pour vous."}
          </p>

          <button
            onClick={() => setView("collections")}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm tracking-[0.2em] uppercase text-emerald-deep font-medium shadow-lg shadow-emerald-deep/40 transition-all hover:bg-gold-light hover:tracking-[0.24em]"
          >
            Découvrir la collection
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gold/70 animate-bounce">
          <span className="text-[10px] tracking-[0.3em] uppercase">Défiler</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. COLLECTION VEDETTE                                       */}
      {/* ============================================================ */}
      <section className="paper py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-gold-deep mb-3">
              Collection Vedette
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-emerald-deep">
              Pièces d&apos;Exception
            </h2>
            <GoldDivider />
            <p className="text-emerald/70 max-w-xl mx-auto leading-relaxed">
              Une sélection de nos créations les plus précieuses, façonnées à la main dans l&apos;atelier de Agadir.
            </p>
          </Reveal>

          {/* Skeleton */}
          {vedettes === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-emerald/10 rounded-md" />
                  <div className="h-4 bg-emerald/10 mt-4 rounded w-3/4" />
                  <div className="h-3 bg-emerald/10 mt-2 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : vedettes.length === 0 ? (
            <p className="text-center text-emerald/60 italic">
              Nos pièces vedettes seront bientôt révélées.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vedettes.slice(0, 4).map((p) => (
                <Reveal key={p.id}>
                  <button
                    onClick={() => openProduit(p.slug)}
                    className="group block w-full text-left rounded-md overflow-hidden border border-gold/15 bg-white/40 transition-all hover:border-gold/60 hover:shadow-xl hover:shadow-emerald-deep/10"
                  >
                    <div className="relative overflow-hidden aspect-[3/4] bg-emerald/5">
                      <img
                        src={firstPhoto(p.photos)}
                        alt={p.nom}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute top-3 left-3 rounded-full bg-gold/90 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-deep">
                        {p.categorie?.libelle || "Couture"}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg text-emerald-deep leading-snug">
                        {p.nom}
                      </h3>
                      <p className="text-xs tracking-wider uppercase text-gold-deep/80 mt-1">
                        {p.tissu}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-base text-emerald">
                          {formatMAD(p.prix)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs tracking-widest uppercase text-gold-deep group-hover:text-gold transition-colors">
                          Découvrir
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}

          <div className="mt-14 text-center">
            <button
              onClick={() => setView("collections")}
              className="inline-flex items-center gap-2 rounded-full border border-emerald/40 px-7 py-3 text-sm tracking-[0.2em] uppercase text-emerald-deep transition-all hover:bg-emerald hover:text-ivory"
            >
              Voir toute la collection
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. NOTRE HISTOIRE — TEASER                                   */}
      {/* ============================================================ */}
      <section className="relative velvet-deep overflow-hidden">
        {/* Khatim watermark */}
        <KhatimStar className="pointer-events-none absolute -right-16 -bottom-16 h-72 w-72 text-gold/[0.06] khatim-spin" />
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 khatim-spin"
          style={{ animationDirection: "reverse" }}
          aria-hidden
        >
          <KhatimStar className="h-full w-full text-gold/[0.05]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image with ornate gold frame */}
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-3 border border-gold/30 rounded-sm" />
                <div className="absolute -inset-1 border border-gold/50 rounded-sm" />
                <div className="relative overflow-hidden rounded-sm">
                  <img
                    src={normalizeImageUrl(contenu.histoire_accueil_image || "/images/atelier-heritage.jpg")}
                    alt="Atelier patrimonial NADIRA — transmission du savoir-faire"
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/40 to-transparent" />
                </div>
                {/* Corner ornaments */}
                <span className="absolute -top-2 -left-2 h-6 w-6 border-t-2 border-l-2 border-gold" />
                <span className="absolute -top-2 -right-2 h-6 w-6 border-t-2 border-r-2 border-gold" />
                <span className="absolute -bottom-2 -left-2 h-6 w-6 border-b-2 border-l-2 border-gold" />
                <span className="absolute -bottom-2 -right-2 h-6 w-6 border-b-2 border-r-2 border-gold" />
              </div>
            </Reveal>

            {/* Text */}
            <Reveal>
              <p className="text-xs tracking-[0.3em] uppercase text-gold mb-4">
                Notre Histoire
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-gold-light leading-tight mb-6">
                {contenu.histoire_accroche ||
                  "Trois générations de mains qui brodent l'âme du Maroc."}
              </h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-12 bg-gold/60" />
                <KhatimStar className="h-3 w-3 text-gold/70" />
                <span className="h-px w-12 bg-gold/60" />
              </div>
              <p className="text-ivory/75 leading-relaxed text-lg max-w-prose">
                {contenu.histoire_texte}
              </p>
              <button
                onClick={() => setView("histoire")}
                className="mt-8 inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-gold-light border-b border-gold/40 pb-1 hover:text-gold hover:border-gold transition-colors"
              >
                Lire notre histoire
                <ArrowRight className="h-4 w-4" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. AVIS CLIENTS                                              */}
      {/* ============================================================ */}
      <section className="paper py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-gold-deep mb-3">
              Témoignages
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-emerald-deep">
              Elles parlent de nous
            </h2>
            <GoldDivider />
          </Reveal>
        </div>

        {/* Marquee */}
        {avis === null ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-6 bg-white/40 rounded-md border border-gold/15">
                <div className="h-4 bg-emerald/10 rounded w-1/3 mb-4" />
                <div className="h-3 bg-emerald/10 rounded w-full mb-2" />
                <div className="h-3 bg-emerald/10 rounded w-5/6 mb-2" />
                <div className="h-3 bg-emerald/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : avis.length === 0 ? (
          <p className="text-center text-emerald/60 italic">
            Les témoignages de nos clientes apparaîtront bientôt.
          </p>
        ) : (
          <div className="relative">
            {/* Edge fades */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-ivory-warm to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-ivory-warm to-transparent z-10" />

            <div className="flex w-max marquee-track gap-6 px-3">
              {[...avis, ...avis, ...avis].map((a, i) => (
                <AvisCard key={`${a.id}-${i}`} avis={a} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 5. CITATION FILIGRANE                                        */}
      {/* ============================================================ */}
      <section className="velvet-deep py-24 relative overflow-hidden">
        <KhatimStar className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[40rem] text-gold/[0.04] khatim-spin" />
        <Reveal className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <KhatimStar className="h-6 w-6 text-gold/70" />
            <span className="h-px w-16 bg-gold/50" />
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="h-px w-16 bg-gold/50" />
            <KhatimStar className="h-6 w-6 text-gold/70" />
          </div>
          <blockquote className="font-display italic text-2xl sm:text-3xl lg:text-4xl text-gold-gradient leading-relaxed">
            {contenu.citation_2 ||
              "« Un caftan n'est jamais terminé. Il s'endort et se réveille avec celle qui le porte. »"}
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="h-px w-20 gold-line" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-ivory/50">
              NADIRA · Agadir
            </span>
            <span className="h-px w-20 gold-line" />
          </div>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 6. CTA FINAL                                                 */}
      {/* ============================================================ */}
      <section className="paper py-24">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center mb-6">
            <NadiraMedallion className="h-24 w-24" />
          </div>
          <h2 className="font-display text-3xl sm:text-5xl text-emerald-deep mb-4">
            Offrez-vous une pièce unique
          </h2>
          <p className="text-emerald/70 max-w-xl mx-auto leading-relaxed mb-8">
            Prenez rendez-vous à l&apos;atelier de Agadir pour une consultation privée. Nous façonnons à vos mesures un caftan qui vous ressemble.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setView("sur-mesure")}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-deep px-8 py-3 text-sm tracking-[0.2em] uppercase text-gold-light border border-gold/40 transition-all hover:bg-emerald"
            >
              Prendre rendez-vous
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("collections")}
              className="inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-emerald-deep border-b border-emerald/30 pb-1 hover:text-gold-deep hover:border-gold transition-colors"
            >
              Voir les collections
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avis card                                                          */
/* ------------------------------------------------------------------ */

function AvisCard({ avis }: { avis: Avis }) {
  return (
    <article className="w-[20rem] sm:w-[24rem] shrink-0 p-6 bg-white/60 backdrop-blur-sm rounded-md border border-gold/20 shadow-sm">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < avis.note ? "text-gold fill-gold" : "text-gold/30"
            }`}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className="font-serif-alt italic text-lg text-emerald-deep/85 leading-relaxed mb-5">
        &ldquo;{avis.commentaire}&rdquo;
      </p>
      <div className="flex items-center gap-2">
        <span className="h-px w-6 bg-gold/60" />
        <p className="text-xs tracking-[0.25em] uppercase text-gold-deep font-medium">
          {avis.nomAuteur}
        </p>
      </div>
    </article>
  );
}
