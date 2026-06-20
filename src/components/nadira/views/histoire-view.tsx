"use client";

import { useStore } from "@/lib/store";
import {
  NadiraMonogram,
  KhatimStar,
  GoldDivider,
} from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { ArrowRight, Award, Heart, Sparkles, Clock } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

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
/* Story paragraphs (evocative French copy)                           */
/* ------------------------------------------------------------------ */

const PARAGRAPHE_TRANSMISSION = `Dans la pénombre dorée de l'atelier, les mains de Fatima Zahra guident celles de Salma, comme autrefois celles de Hajja Rachida guidaient les siennes. Le point de Fès, la sfifa, l'aakad : chacun de ces gestes se transmet sans manuel, par la patience du regard et la répétition patiente des mêmes mouvements. Une brodeuse peut mettre vingt ans à maîtriser un seul point. Nous n'en changeons jamais la grammaire.`;

const PARAGRAPHE_FES = `Fès n'est pas un décor pour nous, c'est notre matière première. L'odeur du cuir qui monte des tanneries au loin, le bruit du marteau sur le cuivre dans les souks, la lumière crue de midi qui tombe sur les toits de la médina : tout cela entre dans nos pièces. Quand vous portez un caftan NADIRA, vous portez un peu de cette médina millénaire, de ses ruelles étroites et de ses cours secrètes.`;

const PARAGRAPHE_SAVOIR_FAIRE = `Broderie main, point de Fès, sfifa, aakad — autant de noms qui désignent des techniques nées dans les cours andalouses et affinées dans les medinas du Maroc. Chaque caftan demande entre 80 et 200 heures de travail. Chaque takchita est pensée comme une architecture : la tahtia, la dtala, le plastron, la ceinture mdamma. Rien n'est laissé au hasard, parce que rien ne l'a jamais été.`;

/* ------------------------------------------------------------------ */
/* Values                                                             */
/* ------------------------------------------------------------------ */

const VALUES = [
  {
    icon: Award,
    title: "Savoir-faire ancestral",
    text: "Des techniques transmises depuis des générations, préservées dans leur forme la plus pure. Le point de Fès, l'aakad, la sfifa : la grammaire intacte de la couture marocaine.",
  },
  {
    icon: Heart,
    title: "Fait main avec amour",
    text: "Chaque couture est posée par une main humaine. Chaque broderie porte la patience et l'intention de l'artisane qui l'a façonnée, pendant des dizaines d'heures.",
  },
  {
    icon: Sparkles,
    title: "Sur-mesure d'exception",
    text: "Vos mesures, vos couleurs, votre occasion. Nous façonnons une pièce qui n'appartient qu'à vous, pensée dans les moindres détails avec nos artisans.",
  },
];

/* ------------------------------------------------------------------ */
/* Numbers                                                            */
/* ------------------------------------------------------------------ */

const CHIFFRES = [
  { value: "3", label: "Générations" },
  { value: "200h", label: "Par pièce" },
  { value: "12", label: "Artisans" },
  { value: "32", label: "Ans de broderie" },
];

/* ------------------------------------------------------------------ */
/* Main view                                                          */
/* ------------------------------------------------------------------ */

export function HistoireView({ contenu }: { contenu: Record<string, string> }) {
  const { setView } = useStore();

  return (
    <div>
      {/* ============================================================ */}
      {/* 1. HERO COURT                                                */}
      {/* ============================================================ */}
      <section className="relative velvet-deep h-[50vh] min-h-[28rem] flex items-center justify-center overflow-hidden">
        <KhatimStar className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[44rem] w-[44rem] text-gold/[0.05] khatim-spin" />
        <div className="pointer-events-none absolute inset-4 sm:inset-6 border border-gold/25 rounded-sm" />

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <div className="flex justify-center mb-5">
            <NadiraMonogram className="h-14 w-14" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-gold/60" />
            <KhatimStar className="h-3 w-3 text-gold/80" />
            <span className="h-px w-10 bg-gold/60" />
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-gold-gradient tracking-[0.08em] mb-4">
            Notre Histoire
          </h1>
          <p className="font-display italic text-lg sm:text-2xl text-ivory/85 leading-relaxed max-w-2xl mx-auto">
            {contenu.histoire_accroche ||
              "Trois générations de mains qui brodent l'âme du Maroc."}
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. STORY SECTION — alternating image and text                */}
      {/* ============================================================ */}
      <section className="paper py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Story 1 — image left, text right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <figure className="relative">
                <div className="absolute -inset-2 border border-gold/30 rounded-sm" />
                <div className="relative overflow-hidden rounded-sm">
                  <img
                    src="/images/atelier-heritage.jpg"
                    alt="Atelier patrimonial NADIRA dans la médina de Fès"
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/30 to-transparent" />
                </div>
                <span className="absolute -top-2 -left-2 h-5 w-5 border-t-2 border-l-2 border-gold" />
                <span className="absolute -top-2 -right-2 h-5 w-5 border-t-2 border-r-2 border-gold" />
                <span className="absolute -bottom-2 -left-2 h-5 w-5 border-b-2 border-l-2 border-gold" />
                <span className="absolute -bottom-2 -right-2 h-5 w-5 border-b-2 border-r-2 border-gold" />
              </figure>
            </Reveal>
            <Reveal>
              <p className="text-xs tracking-[0.3em] uppercase text-gold-deep mb-3">
                Chapitre I · Fès, médina
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-emerald-deep mb-5 leading-tight">
                Née dans la médina de Fès
              </h2>
              <p className="text-emerald/80 leading-relaxed text-lg">
                {contenu.histoire_texte}
              </p>
            </Reveal>
          </div>

          <GoldDivider />

          {/* Story 2 — text left, image right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal className="lg:order-1 order-2">
              <p className="text-xs tracking-[0.3em] uppercase text-gold-deep mb-3">
                Chapitre II · La transmission
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-emerald-deep mb-5 leading-tight">
                Vingt ans pour un point
              </h2>
              <p className="text-emerald/80 leading-relaxed text-lg">
                {PARAGRAPHE_TRANSMISSION}
              </p>
            </Reveal>
            <Reveal className="lg:order-2 order-1">
              <figure className="relative">
                <div className="absolute -inset-2 border border-gold/30 rounded-sm" />
                <div className="relative overflow-hidden rounded-sm">
                  <img
                    src="/images/artisan-1.jpg"
                    alt="Artisane brodeuse de NADIRA — gestes ancestraux"
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/30 to-transparent" />
                </div>
                <span className="absolute -top-2 -left-2 h-5 w-5 border-t-2 border-l-2 border-gold" />
                <span className="absolute -top-2 -right-2 h-5 w-5 border-t-2 border-r-2 border-gold" />
                <span className="absolute -bottom-2 -left-2 h-5 w-5 border-b-2 border-l-2 border-gold" />
                <span className="absolute -bottom-2 -right-2 h-5 w-5 border-b-2 border-r-2 border-gold" />
              </figure>
            </Reveal>
          </div>

          <GoldDivider />

          {/* Story 3 — image left, text right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <figure className="relative">
                <div className="absolute -inset-2 border border-gold/30 rounded-sm" />
                <div className="relative overflow-hidden rounded-sm">
                  <img
                    src="/images/artisan-3.jpg"
                    alt="Finitions et passementerie dans l'atelier NADIRA"
                    loading="lazy"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/30 to-transparent" />
                </div>
                <span className="absolute -top-2 -left-2 h-5 w-5 border-t-2 border-l-2 border-gold" />
                <span className="absolute -top-2 -right-2 h-5 w-5 border-t-2 border-r-2 border-gold" />
                <span className="absolute -bottom-2 -left-2 h-5 w-5 border-b-2 border-l-2 border-gold" />
                <span className="absolute -bottom-2 -right-2 h-5 w-5 border-b-2 border-r-2 border-gold" />
              </figure>
            </Reveal>
            <Reveal>
              <p className="text-xs tracking-[0.3em] uppercase text-gold-deep mb-3">
                Chapitre III · Savoir-faire
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-emerald-deep mb-5 leading-tight">
                L&apos;architecture d&apos;une pièce
              </h2>
              <p className="text-emerald/80 leading-relaxed text-lg mb-5">
                {PARAGRAPHE_FES}
              </p>
              <p className="text-emerald/80 leading-relaxed text-lg">
                {PARAGRAPHE_SAVOIR_FAIRE}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. VALUES SECTION                                            */}
      {/* ============================================================ */}
      <section className="velvet-deep py-24 relative overflow-hidden">
        <KhatimStar className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 text-gold/[0.05] khatim-spin" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] uppercase text-gold mb-3">
              Nos valeurs
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-gold-light">
              Ce que nous défendons
            </h2>
            <GoldDivider />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title}>
                  <article className="h-full text-center px-6 py-10 rounded-md border border-gold/25 bg-emerald-deep/40 backdrop-blur-sm transition-all hover:border-gold/60 hover:bg-emerald-deep/60">
                    <div className="flex justify-center mb-5">
                      <div className="h-16 w-16 rounded-full border border-gold/40 flex items-center justify-center">
                        <Icon className="h-7 w-7 text-gold" strokeWidth={1.4} />
                      </div>
                    </div>
                    <h3 className="font-display text-xl text-gold-light mb-3">
                      {v.title}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="h-px w-8 bg-gold/50" />
                      <KhatimStar className="h-2.5 w-2.5 text-gold/70" />
                      <span className="h-px w-8 bg-gold/50" />
                    </div>
                    <p className="text-ivory/75 leading-relaxed text-sm">
                      {v.text}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. CHIFFRES / TIMELINE                                       */}
      {/* ============================================================ */}
      <section className="paper py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-gold-deep mb-3 flex items-center justify-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              L&apos;atelier en chiffres
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-emerald-deep">
              La mesure du savoir-faire
            </h2>
            <GoldDivider />
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {CHIFFRES.map((c) => (
              <Reveal key={c.label}>
                <div className="text-center px-4 py-8 border-t border-b border-gold/30">
                  <p className="font-display text-5xl sm:text-6xl text-gold-gradient mb-2">
                    {c.value}
                  </p>
                  <p className="text-xs tracking-[0.3em] uppercase text-emerald-deep/70">
                    {c.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CITATION PULL-QUOTE                                       */}
      {/* ============================================================ */}
      <section className="velvet-deep py-24 relative overflow-hidden">
        <KhatimStar className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[40rem] text-gold/[0.04] khatim-spin" />
        <Reveal className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <KhatimStar className="h-7 w-7 text-gold/70" />
            <span className="h-px w-20 gold-line" />
            <KhatimStar className="h-7 w-7 text-gold/70" />
          </div>
          <blockquote className="font-display italic text-3xl sm:text-4xl lg:text-5xl text-gold-gradient leading-relaxed">
            {contenu.citation_1 ||
              "« Le fil d'or ne ment pas : il garde la mémoire des mains qui l'ont tiré. »"}
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="h-px w-16 gold-line" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-ivory/50">
              Sagesse de l&apos;atelier
            </span>
            <span className="h-px w-16 gold-line" />
          </div>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 6. CTA                                                       */}
      {/* ============================================================ */}
      <section className="paper py-24">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl sm:text-5xl text-emerald-deep mb-4">
            Découvrez nos collections
          </h2>
          <p className="text-emerald/70 max-w-xl mx-auto leading-relaxed mb-8">
            Chaque pièce raconte une histoire. Trouvez celle qui deviendra la vôtre, ou commandez-la sur-mesure à l&apos;atelier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setView("collections")}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm tracking-[0.2em] uppercase text-emerald-deep font-medium transition-all hover:bg-gold-light"
            >
              Voir les collections
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("sur-mesure")}
              className="inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-emerald-deep border-b border-emerald/30 pb-1 hover:text-gold-deep hover:border-gold transition-colors"
            >
              Commander sur-mesure
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
