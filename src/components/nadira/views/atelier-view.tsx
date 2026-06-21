"use client";

import { useEffect, useState } from "react";
import {
  Scissors,
  Spool,
  Award,
  ArrowRight,
  Gem,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { Artisan } from "@/lib/types";
import {
  NadiraMonogram,
  KhatimStar,
  GoldDivider,
} from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TECHNIQUES = [
  {
    icon: Scissors,
    title: "Point de Agadir",
    short: "Broderie main",
    desc: "Point serré exécuté sur métier traditionnel, originaire des ateliers de Agadir. Les motifs floraux et géométriques se déploient fil après fil, sans jamais doubler l'étoffe.",
  },
  {
    icon: Spool,
    title: "Sfifa",
    short: "Passementerie",
    desc: "Tresse dorée tissée au fil de soie qui borde les ouvertures et souligne les coutures. Symbole d'élégance, la sfifa exige une main patiente et un œil sûr.",
  },
  {
    icon: Gem,
    title: "Aakad",
    short: "Boutons tissés",
    desc: "Boutons noués main en forme de boule de soie — chacun nécessite une vingtaine de gestes précis. Leur nombre et leur couleur racontent la pièce.",
  },
  {
    icon: Award,
    title: "Rabat",
    short: "Dentelle",
    desc: "Dentelle à la main, héritée des ateliers de Rabat, appliquée en motifs ajourés sur les pans et les manches. Une œuvre de patience où le vide compte autant que le plein.",
  },
];

const NUMBERS = [
  { value: "12", label: "artisans" },
  { value: "3", label: "générations" },
  { value: "200h", label: "par pièce" },
  { value: "32 ans", label: "de savoir-faire" },
];

const DEFAULT_ARTISANS: Artisan[] = [
  {
    id: 1, nom: "Fatima Zahra", specialite: "Broderie main",
    biographie: "Trente-deux ans derrière le métier. Elle connaît par cœur les 84 points du répertoire de Agadir.",
    photo: "/images/artisan-1.jpg", ordre: 1,
  },
  {
    id: 2, nom: "Khadija El Amrani", specialite: "Coupe & assemblage",
    biographie: "Ancienne coupeuse des ateliers royaux, elle donne au tissu son volume et son tombé.",
    photo: "/images/artisan-2.jpg", ordre: 2,
  },
  {
    id: 3, nom: "Hajja Rachida", specialite: "Finitions & passementerie",
    biographie: "Gardienne du geste de la sfifa. Soixante-quatorze ans, dont cinquante à tresser l'or sur la soie.",
    photo: "/images/artisan-3.jpg", ordre: 3,
  },
  {
    id: 4, nom: "Salma Benkirane", specialite: "Takchita & sfifa",
    biographie: "La plus jeune de l'atelier et déjà maître du drapé de la takchita. Formée par Hajja Rachida.",
    photo: "/images/artisan-1.jpg", ordre: 4,
  },
];

export function AtelierView({ contenu }: { contenu: Record<string, string> }) {
  const { setView } = useStore();
  const [artisans, setArtisans] = useState<Artisan[]>(DEFAULT_ARTISANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Artisan[]>("/api/artisans")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setArtisans(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const atelierTexte =
    contenu.atelier_texte ||
    "Au cœur de Quartier Salam à Agadir, l'atelier NADIRA réunit douze artisans qui perpétuent des gestes transmis depuis trois générations. Chaque caftan exige près de deux cents heures de travail, partagées entre la coupe, la broderie main, la sfifa, l'aakad et les finitions.";

  const citation = contenu.citation_2 ||
    "« Le fil retient ce que la parole oublie. »";

  return (
    <div className="bg-background">
      <Hero />
      <Story texte={atelierTexte} />
      <ArtisansGrid artisans={artisans} loading={loading} />
      <Techniques />
      <NumbersBand />
      <Citation texte={citation} />
      <CTA onSurMesure={() => setView("sur-mesure")} />
    </div>
  );
}

/* ============== HERO ============== */
function Hero() {
  const { ref, visible } = useReveal();
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 velvet-deep">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/images/atelier-heritage.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-emerald-deep/55" aria-hidden />
      <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
        <KhatimStar className="absolute top-8 right-8 h-64 w-64 text-gold khatim-spin" />
      </div>
      <div
        ref={ref}
        className={cn(
          "relative mx-auto max-w-4xl px-4 sm:px-6 text-center reveal",
          visible && "in-view"
        )}
      >
        <NadiraMonogram className="mx-auto h-14 w-14" animate />
        <p className="mt-6 text-xs uppercase tracking-[0.4em] text-gold-light/80">
          Agadir · Maroc
        </p>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl text-gold-gradient font-semibold">
          L'Atelier
        </h1>
        <p className="mt-4 font-serif-alt text-2xl sm:text-3xl text-ivory/90 italic">
          Les mains qui brodent l'âme du Maroc
        </p>
        <GoldDivider className="my-6" />
      </div>
    </section>
  );
}

/* ============== STORY ============== */
function Story({ texte }: { texte: string }) {
  const { ref, visible } = useReveal();
  return (
    <section className="paper py-20 sm:py-24">
      <div
        ref={ref}
        className={cn(
          "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-2 lg:items-center reveal",
          visible && "in-view"
        )}
      >
        {/* Left — image in gold frame */}
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-gold/40 shadow-2xl shadow-emerald-deep/30">
            <img
              src="/images/atelier-heritage.jpg"
              alt="Atelier NADIRA — savoir-faire marocain"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/40 to-transparent" />
          </div>
          {/* Decorative corner stars */}
          <KhatimStar className="absolute -top-4 -right-4 h-12 w-12 text-gold/60 bg-ivory-warm rounded-full p-1.5 border border-gold/30" />
          <KhatimStar className="absolute -bottom-4 -left-4 h-10 w-10 text-gold/60 bg-ivory-warm rounded-full p-1 border border-gold/30" />
        </div>

        {/* Right — story text */}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
            L'histoire de la maison
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-emerald-deep">
            Un atelier, douze mains, trois générations
          </h2>
          <GoldDivider className="!justify-start !my-6" />
          <p className="text-foreground/80 leading-relaxed first-letter:font-display first-letter:text-5xl first-letter:text-gold-deep first-letter:mr-2 first-letter:float-left first-letter:leading-none">
            {texte}
          </p>
          <div className="mt-6 space-y-3 text-foreground/75">
            <BulletLine>
              Douze artisans — brodeuses, coupeuses, passementières — partagent
              la lumière tamisée des patios de Agadir.
            </BulletLine>
            <BulletLine>
              Quatre techniques y cohabitent : le point de Fès pour la broderie,
              la sfifa pour la passementerie, l'aakad pour les boutons tissés,
              et la dentelle de Rabat pour les jours ajourés.
            </BulletLine>
            <BulletLine>
              Près de deux cents heures de travail sont nécessaires pour confectionner
              un caftan d'apparat — du premier croquis à la dernière maille.
            </BulletLine>
          </div>
        </div>
      </div>
    </section>
  );
}

function BulletLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-3 leading-relaxed">
      <KhatimStar className="mt-1 h-4 w-4 shrink-0 text-gold" />
      <span>{children}</span>
    </p>
  );
}

/* ============== ARTISANS GRID ============== */
function ArtisansGrid({
  artisans,
  loading,
}: {
  artisans: Artisan[];
  loading: boolean;
}) {
  const { ref, visible } = useReveal();
  return (
    <section className="velvet-deep py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-light/80">
            Les gardiens du geste
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-gold-gradient">
            Nos artisans
          </h2>
          <p className="mt-3 text-ivory/70 max-w-2xl mx-auto">
            Chacune porte un savoir unique, hérité et enrichi. Ce sont elles
            qui donnent à NADIRA sa voix.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "grid gap-6 sm:grid-cols-2 lg:grid-cols-4 reveal",
            visible && "in-view"
          )}
        >
          {loading && artisans.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <ArtisanSkeleton key={i} />
              ))
            : artisans.map((a, i) => (
                <ArtisanCard key={a.id ?? i} artisan={a} index={i} />
              ))}
        </div>
      </div>
    </section>
  );
}

function ArtisanCard({ artisan, index }: { artisan: Artisan; index: number }) {
  const initials = artisan.nom
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="group relative rounded-2xl border border-gold/30 velvet p-6 text-center overflow-hidden transition-transform hover:-translate-y-1"
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="absolute -top-6 -right-6 h-24 w-24 opacity-10 group-hover:opacity-20 transition-opacity">
        <KhatimStar className="h-full w-full text-gold khatim-spin" />
      </div>
      {/* Photo or initials watermark */}
      <div className="relative mx-auto h-28 w-28 rounded-full overflow-hidden border-2 border-gold/40 bg-emerald-deep">
        {artisan.photo ? (
          <img
            src={artisan.photo}
            alt={artisan.nom}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {!artisan.photo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <KhatimStar className="h-12 w-12 text-gold/30" />
          </div>
        )}
        {!artisan.photo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-3xl text-gold-light/80">{initials}</span>
          </div>
        )}
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gold-deep">
        {artisan.specialite}
      </p>
      <h3 className="mt-1 font-display text-xl text-gold-light">
        {artisan.nom}
      </h3>
      <div className="mx-auto my-3 h-px w-12 gold-line" />
      <p className="text-sm text-ivory/75 italic leading-relaxed">
        {artisan.biographie || ""}
      </p>
    </div>
  );
}

function ArtisanSkeleton() {
  return (
    <div className="rounded-2xl border border-gold/20 velvet p-6 text-center animate-pulse">
      <div className="mx-auto h-28 w-28 rounded-full bg-gold/10" />
      <div className="mx-auto mt-4 h-3 w-20 bg-gold/10 rounded" />
      <div className="mx-auto mt-3 h-5 w-32 bg-gold/15 rounded" />
      <div className="mx-auto mt-3 h-px w-12 bg-gold/10" />
      <div className="mt-3 space-y-2">
        <div className="mx-auto h-3 w-full bg-ivory/10 rounded" />
        <div className="mx-auto h-3 w-3/4 bg-ivory/10 rounded" />
      </div>
    </div>
  );
}

/* ============== TECHNIQUES ============== */
function Techniques() {
  const { ref, visible } = useReveal();
  return (
    <section className="paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
            Le répertoire des gestes
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-emerald-deep">
            Quatre techniques, une signature
          </h2>
        </div>
        <div
          ref={ref}
          className={cn(
            "grid gap-6 sm:grid-cols-2 lg:grid-cols-4 reveal",
            visible && "in-view"
          )}
        >
          {TECHNIQUES.map((t, i) => (
            <div
              key={t.title}
              className="group rounded-2xl border border-gold/25 bg-white/60 p-6 transition-transform hover:-translate-y-1"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full velvet-deep flex items-center justify-center border border-gold/30">
                  <t.icon className="h-5 w-5 text-gold-light" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-emerald-deep leading-none">
                    {t.title}
                  </h3>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gold-deep mt-1">
                    {t.short}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== NUMBERS BAND ============== */
function NumbersBand() {
  const { ref, visible } = useReveal();
  return (
    <section className="velvet-deep py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <KhatimStar className="absolute -top-10 -left-10 h-72 w-72 text-gold khatim-spin" />
        <KhatimStar className="absolute -bottom-10 -right-10 h-72 w-72 text-gold khatim-spin" />
      </div>
      <div
        ref={ref}
        className={cn(
          "relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 reveal",
          visible && "in-view"
        )}
      >
        {NUMBERS.map((n, i) => (
          <div key={n.label} className="text-center" style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="font-display text-4xl sm:text-5xl text-gold-gradient font-semibold">
              {n.value}
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.25em] text-ivory/70">
              {n.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============== CITATION ============== */
function Citation({ texte }: { texte: string }) {
  const { ref, visible } = useReveal();
  return (
    <section className="paper py-20 sm:py-24">
      <div
        ref={ref}
        className={cn(
          "mx-auto max-w-3xl px-4 sm:px-6 text-center reveal",
          visible && "in-view"
        )}
      >
        <KhatimStar className="mx-auto h-10 w-10 text-gold/70" />
        <blockquote className="mt-6 font-serif-alt text-2xl sm:text-3xl text-emerald-deep italic leading-relaxed">
          {texte}
        </blockquote>
        <GoldDivider className="mt-6" />
      </div>
    </section>
  );
}

/* ============== CTA ============== */
function CTA({ onSurMesure }: { onSurMesure: () => void }) {
  return (
    <section className="velvet py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl text-gold-gradient">
          Commander une pièce sur-mesure
        </h2>
        <p className="mt-3 text-ivory/70">
          Confiez-nous votre silhouette et votre désir. Le reste appartient à
          nos artisans.
        </p>
        <Button
          onClick={onSurMesure}
          className="mt-8 bg-gold text-emerald-deep hover:bg-gold-light h-12 px-8 text-base"
        >
          Commencer ma demande
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
