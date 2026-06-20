"use client";

import { useEffect, useState } from "react";
import {
  Ruler,
  Calendar,
  Scissors,
  Phone,
  User,
  Mail,
  Check,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { api, formatDate } from "@/lib/api";
import type { Mesure } from "@/lib/types";
import {
  NadiraMonogram,
  GoldDivider,
  KhatimStar,
} from "@/components/nadira/brand";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Calendar as CalendarPicker,
} from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MesureField =
  | "tourPoitrine"
  | "tourTaille"
  | "tourHanches"
  | "longueurRobe"
  | "longueurManche"
  | "longueurEpaule"
  | "tourBras";

type RdvType = "essayage" | "consultation";

const MESURE_FIELDS: {
  key: MesureField;
  label: string;
  help: string;
}[] = [
  { key: "tourPoitrine", label: "Tour de poitrine", help: "Mesurez autour de la partie la plus pleine de la poitrine." },
  { key: "tourTaille", label: "Tour de taille", help: "Mesurez autour de la taille naturelle, sans serrer." },
  { key: "tourHanches", label: "Tour de hanches", help: "Mesurez autour de la partie la plus pleine des hanches." },
  { key: "longueurRobe", label: "Longueur robe", help: "De l'épaule à la longueur souhaitée du pan." },
  { key: "longueurManche", label: "Longueur manche", help: "De l'épaule au poignet, le bras légèrement fléchi." },
  { key: "longueurEpaule", label: "Longueur épaule", help: "De la base du cou au sommet de l'épaule." },
  { key: "tourBras", label: "Tour de bras", help: "Around the bicep, au point le plus fort." },
];

const PROCESS_STEPS = [
  {
    num: "01",
    icon: Calendar,
    title: "Rendez-vous",
    desc: "Essayage en atelier à Fès ou consultation virtuelle pour cerner votre désir et définir la pièce.",
  },
  {
    num: "02",
    icon: Ruler,
    title: "Prise de mesures",
    desc: "Séance minutieuse au centimètre près, accompagnée d'un croquis annoté par notre première d'atelier.",
  },
  {
    num: "03",
    icon: Scissors,
    title: "Confection",
    desc: "Broderie main, sfifa et finitions — délai de 3 à 6 semaines selon l'ouvrage et la saison.",
  },
];

function isValidPhone(tel: string) {
  const t = tel.replace(/[\s.-]/g, "");
  return /^(?:\+212|0)(?:[5-7]\d{8})$/.test(t);
}

export function SurMesureView() {
  const { setView } = useStore();
  const [mesures, setMesures] = useState<Record<MesureField, string>>({
    tourPoitrine: "",
    tourTaille: "",
    tourHanches: "",
    longueurRobe: "",
    longueurManche: "",
    longueurEpaule: "",
    tourBras: "",
  });
  const [notes, setNotes] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [rdvType, setRdvType] = useState<RdvType>("essayage");
  const [dateRdv, setDateRdv] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Prefill mesures on phone blur
  const checkPhonePrefill = async () => {
    const tel = telephone.trim();
    if (!tel || !isValidPhone(tel)) {
      setPrefillNote(null);
      return;
    }
    setCheckingPhone(true);
    try {
      const existing = await api<Mesure[]>(`/api/mesures?telephone=${encodeURIComponent(tel)}`);
      if (existing && existing.length > 0) {
        const latest = existing[0];
        const next: Record<MesureField, string> = { ...mesures };
        (Object.keys(mesures) as MesureField[]).forEach((k) => {
          const v = (latest as unknown as Record<string, number | null>)[k];
          if (v != null && !next[k]) next[k] = String(v);
        });
        setMesures(next);
        if (latest.notes && !notes) setNotes(latest.notes);
        setPrefillNote("Mesures existantes trouvées pour ce téléphone — pré-rempli.");
      } else {
        setPrefillNote(null);
      }
    } catch {
      setPrefillNote(null);
    } finally {
      setCheckingPhone(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nom.trim()) e.nom = "Nom requis";
    if (!telephone.trim()) e.telephone = "Téléphone requis";
    else if (!isValidPhone(telephone)) e.telephone = "Format attendu : 06XXXXXXXX ou +212XXXXXXXXX";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Adresse e-mail invalide";
    if (!dateRdv) e.dateRdv = "Veuillez choisir une date";
    else if (dateRdv < new Date(new Date().setHours(0, 0, 0, 0)))
      e.dateRdv = "La date doit être à venir";
    // At least poitrine + taille recommended
    if (!mesures.tourPoitrine && !mesures.tourTaille) {
      e.mesures = "Indiquez au moins le tour de poitrine et le tour de taille.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fullNom = `${prenom} ${nom}`.trim();
      const mesuresPayload: Record<string, number | string | null> = {
        telephone,
        tourPoitrine: mesures.tourPoitrine ? Number(mesures.tourPoitrine) : null,
        tourTaille: mesures.tourTaille ? Number(mesures.tourTaille) : null,
        tourHanches: mesures.tourHanches ? Number(mesures.tourHanches) : null,
        longueurRobe: mesures.longueurRobe ? Number(mesures.longueurRobe) : null,
        longueurManche: mesures.longueurManche ? Number(mesures.longueurManche) : null,
        longueurEpaule: mesures.longueurEpaule ? Number(mesures.longueurEpaule) : null,
        tourBras: mesures.tourBras ? Number(mesures.tourBras) : null,
        notes: notes || null,
      };
      const rdvPayload = {
        nom: fullNom,
        telephone,
        email: email || undefined,
        dateRdv: dateRdv!.toISOString(),
        type: rdvType,
        notes: `Demande sur-mesure. Mesures : poitrine ${mesures.tourPoitrine || "—"} / taille ${mesures.tourTaille || "—"} / hanches ${mesures.tourHanches || "—"}. ${notes || ""}`.trim(),
      };
      await Promise.all([
        api("/api/mesures", { method: "POST", body: JSON.stringify(mesuresPayload) }),
        api("/api/rendezvous", { method: "POST", body: JSON.stringify(rdvPayload) }),
      ]);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <SuccessScreen
      date={dateRdv}
      rdvType={rdvType}
      onReset={() => {
        setSuccess(false);
        setMesures({
          tourPoitrine: "", tourTaille: "", tourHanches: "", longueurRobe: "",
          longueurManche: "", longueurEpaule: "", tourBras: "",
        });
        setNotes(""); setNom(""); setPrenom(""); setTelephone("");
        setEmail(""); setDateRdv(undefined);
      }}
      goCollections={() => setView("collections")}
    />;
  }

  return (
    <div className="bg-background">
      <Hero />
      <ProcessSteps />
      <MeasurementSection
        mesures={mesures}
        setMesures={setMesures}
        notes={notes}
        setNotes={setNotes}
        nom={nom}
        setNom={setNom}
        prenom={prenom}
        setPrenom={setPrenom}
        telephone={telephone}
        setTelephone={setTelephone}
        email={email}
        setEmail={setEmail}
        rdvType={rdvType}
        setRdvType={setRdvType}
        dateRdv={dateRdv}
        setDateRdv={setDateRdv}
        errors={errors}
        submitting={submitting}
        onSubmit={submit}
        onPhoneBlur={checkPhonePrefill}
        prefillNote={prefillNote}
        checkingPhone={checkingPhone}
      />
      <Reassurance />
    </div>
  );
}

/* ============== HERO ============== */
function Hero() {
  const { ref, visible } = useReveal();
  return (
    <section className="velvet-deep relative overflow-hidden py-20 sm:py-24">
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
        <KhatimStar className="absolute -top-12 -right-12 h-80 w-80 text-gold khatim-spin" />
        <KhatimStar className="absolute -bottom-16 -left-16 h-72 w-72 text-gold khatim-spin" />
      </div>
      <div
        ref={ref}
        className={cn(
          "relative mx-auto max-w-4xl px-4 sm:px-6 text-center reveal",
          visible && "in-view"
        )}
      >
        <NadiraMonogram className="mx-auto h-16 w-16" animate />
        <h1 className="mt-6 font-display text-5xl sm:text-6xl text-gold-gradient font-semibold tracking-wide">
          Sur-Mesure
        </h1>
        <p className="mt-4 font-serif-alt text-2xl sm:text-3xl text-ivory/90 italic">
          Chaque pièce est façonnée à votre image
        </p>
        <GoldDivider className="my-6" />
        <p className="mx-auto max-w-2xl text-ivory/70 leading-relaxed">
          L'expérience sur-mesure NADIRA suit un rituel en trois temps :
          le rendez-vous où s'échange le désir, la prise de mesures au centimètre
          près, puis la confection patiente de votre pièce dans nos ateliers de
          Fès. Trois étapes, une seule promesse — un vêtement qui n'appartient
          qu'à vous.
        </p>
      </div>
    </section>
  );
}

/* ============== PROCESS STEPS ============== */
function ProcessSteps() {
  const { ref, visible } = useReveal();
  return (
    <section className="paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
            Le rituel NADIRA
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-emerald-deep">
            Trois étapes, une seule promesse
          </h2>
        </div>
        <div
          ref={ref}
          className={cn(
            "grid gap-6 md:grid-cols-3 reveal",
            visible && "in-view"
          )}
        >
          {PROCESS_STEPS.map((step, i) => (
            <div
              key={step.num}
              className={cn(
                "relative rounded-2xl border border-gold/25 bg-white/60 p-8 text-center shadow-sm",
                "transition-transform hover:-translate-y-1"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full velvet-deep flex items-center justify-center border border-gold/40">
                <step.icon className="h-5 w-5 text-gold-light" />
              </div>
              <div className="mt-6 font-display text-5xl text-gold/40 font-semibold">
                {step.num}
              </div>
              <h3 className="mt-2 font-display text-xl text-emerald-deep">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-foreground/70 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== MEASUREMENT SECTION ============== */
function MeasurementSection(props: {
  mesures: Record<MesureField, string>;
  setMesures: (v: Record<MesureField, string>) => void;
  notes: string;
  setNotes: (v: string) => void;
  nom: string;
  setNom: (v: string) => void;
  prenom: string;
  setPrenom: (v: string) => void;
  telephone: string;
  setTelephone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  rdvType: RdvType;
  setRdvType: (v: RdvType) => void;
  dateRdv: Date | undefined;
  setDateRdv: (v: Date | undefined) => void;
  errors: Record<string, string>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onPhoneBlur: () => void;
  prefillNote: string | null;
  checkingPhone: boolean;
}) {
  const { ref, visible } = useReveal<HTMLFormElement>();
  const {
    mesures, setMesures, notes, setNotes,
    nom, setNom, prenom, setPrenom, telephone, setTelephone, email, setEmail,
    rdvType, setRdvType, dateRdv, setDateRdv,
    errors, submitting, onSubmit, onPhoneBlur, prefillNote, checkingPhone,
  } = props;

  const updateMesure = (k: MesureField, v: string) => {
    // digits only
    const clean = v.replace(/[^\d.]/g, "");
    setMesures({ ...mesures, [k]: clean });
  };

  return (
    <section className="paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
            Votre silhouette, nos gestes
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-emerald-deep">
            Vos mesures & votre rendez-vous
          </h2>
        </div>

        <form
          ref={ref}
          onSubmit={onSubmit}
          className={cn(
            "grid gap-10 lg:grid-cols-2 reveal",
            visible && "in-view"
          )}
        >
          {/* LEFT — silhouette diagram */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-gold/25 bg-white/70 p-6 sm:p-8 shadow-sm">
              <h3 className="font-display text-xl text-emerald-deep mb-2">
                Guide des mesures
              </h3>
              <p className="text-sm text-foreground/65 mb-4">
                Référez-vous au schéma ci-dessous. Un mètre-ruban souple suffit ;
                faites-vous accompagner pour plus de précision.
              </p>
              <SilhouetteDiagram mesures={mesures} />
            </div>
          </div>

          {/* RIGHT — form fields */}
          <div className="space-y-8">
            {/* Mesures */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="h-4 w-4 text-gold-deep" />
                <h3 className="font-display text-xl text-emerald-deep">
                  Mesures corporelles
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {MESURE_FIELDS.map((f) => (
                  <MesureInput
                    key={f.key}
                    label={f.label}
                    help={f.help}
                    value={mesures[f.key]}
                    onChange={(v) => updateMesure(f.key, v)}
                  />
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="notes" className="text-sm text-emerald-deep mb-1.5 block">
                  Notes (morphologie, préférences, pièce envisagée)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex. épaules étroites, j'aime les manches amples, caftan pour mariage en juin..."
                  className="min-h-20 bg-white/70"
                />
              </div>
            </div>

            <Separator className="bg-gold/20" />

            {/* Coordonnées */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-gold-deep" />
                <h3 className="font-display text-xl text-emerald-deep">
                  Vos coordonnées
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" required={false}>
                  <Input
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Prénom"
                    className="bg-white/70"
                  />
                </Field>
                <Field label="Nom" required error={errors.nom}>
                  <Input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Nom"
                    className="bg-white/70"
                  />
                </Field>
                <Field label="Téléphone" required error={errors.telephone}>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-deep/70" />
                    <Input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      onBlur={onPhoneBlur}
                      placeholder="06 12 34 56 78"
                      className="pl-9 bg-white/70"
                    />
                    {checkingPhone && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gold-deep/70">
                        …
                      </span>
                    )}
                  </div>
                </Field>
                <Field label="E-mail" required={false} error={errors.email}>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-deep/70" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="pl-9 bg-white/70"
                    />
                  </div>
                </Field>
              </div>
              {prefillNote && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-emerald-deep">
                  <Check className="h-4 w-4 text-gold-deep" />
                  {prefillNote}
                </div>
              )}
            </div>

            <Separator className="bg-gold/20" />

            {/* RDV */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-gold-deep" />
                <h3 className="font-display text-xl text-emerald-deep">
                  Votre rendez-vous
                </h3>
              </div>
              <Field label="Type de rendez-vous" required>
                <RadioGroup
                  value={rdvType}
                  onValueChange={(v) => setRdvType(v as RdvType)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <label
                    htmlFor="rdv-essayage"
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                      rdvType === "essayage"
                        ? "border-gold bg-gold/10"
                        : "border-gold/25 bg-white/60 hover:bg-white/80"
                    )}
                  >
                    <RadioGroupItem id="rdv-essayage" value="essayage" className="mt-0.5" />
                    <div>
                      <div className="font-display text-sm text-emerald-deep">
                        Essayage en atelier
                      </div>
                      <div className="text-xs text-foreground/65 mt-0.5">
                        Fès · médina · sur rendez-vous
                      </div>
                    </div>
                  </label>
                  <label
                    htmlFor="rdv-consultation"
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                      rdvType === "consultation"
                        ? "border-gold bg-gold/10"
                        : "border-gold/25 bg-white/60 hover:bg-white/80"
                    )}
                  >
                    <RadioGroupItem id="rdv-consultation" value="consultation" className="mt-0.5" />
                    <div>
                      <div className="font-display text-sm text-emerald-deep">
                        Consultation virtuelle
                      </div>
                      <div className="text-xs text-foreground/65 mt-0.5">
                        Visioconférence · 45 min
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </Field>

              <Field label="Date souhaitée" required error={errors.dateRdv} className="mt-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white/70 border-gold/30"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-gold-deep" />
                      {dateRdv ? formatDate(dateRdv) : "Choisir une date..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={dateRdv}
                      onSelect={setDateRdv}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/55">
                <Clock className="h-3 w-3" />
                L'atelier vous contacte pour confirmer l'heure exacte.
              </p>
            </div>

            {errors.mesures && (
              <p className="text-sm text-destructive">{errors.mesures}</p>
            )}
            {errors.submit && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 velvet-deep text-gold-light border border-gold/40 hover:bg-emerald-soft text-base tracking-wide"
            >
              {submitting ? (
                <>
                  <span className="animate-pulse">Enregistrement…</span>
                </>
              ) : (
                <>
                  Envoyer ma demande de sur-mesure
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ============== MESURE INPUT ============== */
function MesureInput({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
        {label}
      </Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="pr-10 bg-white/70"
          aria-label={label}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold-deep/70 pointer-events-none">
          cm
        </span>
      </div>
      <p className="mt-1 text-[11px] text-foreground/50 leading-snug">{help}</p>
    </div>
  );
}

/* ============== FIELD WRAPPER ============== */
function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
        {label} {required && <span className="text-gold-deep">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ============== SILHOUETTE SVG DIAGRAM ============== */
function SilhouetteDiagram({
  mesures,
}: {
  mesures: Record<MesureField, string>;
}) {
  // Color in points that have a value
  const has = (k: MesureField) => mesures[k] !== "";
  return (
    <div className="relative aspect-[3/4] w-full max-w-xs mx-auto rounded-xl bg-ivory border border-gold/20 overflow-hidden">
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="silhouette-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E3C879" />
            <stop offset="100%" stopColor="#A9842D" />
          </linearGradient>
        </defs>

        {/* Decorative corner stars */}
        <g opacity="0.25" stroke="#C9A24B" strokeWidth="0.8" fill="none">
          <g transform="translate(20 20) scale(0.1)">
            <rect x="0" y="0" width="100" height="100" />
            <rect x="0" y="0" width="100" height="100" transform="rotate(45 50 50)" />
          </g>
          <g transform="translate(265 20) scale(0.1)">
            <rect x="0" y="0" width="100" height="100" />
            <rect x="0" y="0" width="100" height="100" transform="rotate(45 50 50)" />
          </g>
        </g>

        {/* Dressform silhouette (stylized woman's bust form) */}
        <g
          stroke="url(#silhouette-gold)"
          strokeWidth="1.8"
          fill="rgba(201, 162, 75, 0.05)"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Neck */}
          <path d="M 138 70 Q 150 60 162 70 L 162 92 Q 150 96 138 92 Z" />
          {/* Shoulders → bust → waist → hips (dressform outline) */}
          <path d="
            M 110 100
            Q 150 86 190 100
            Q 215 110 215 140
            Q 215 168 192 180
            Q 175 188 168 200
            Q 162 220 158 244
            Q 156 270 150 285
            Q 144 270 142 244
            Q 138 220 132 200
            Q 125 188 108 180
            Q 85 168 85 140
            Q 85 110 110 100
            Z
          " />
          {/* Stand */}
          <line x1="150" y1="285" x2="150" y2="320" />
          <ellipse cx="150" cy="328" rx="40" ry="6" fill="rgba(201, 162, 75, 0.08)" />
          <line x1="120" y1="334" x2="180" y2="334" />
        </g>

        {/* Measurement annotation lines & dots */}
        <g stroke="#A9842D" strokeWidth="1" fill="#A9842D" fontFamily="var(--font-serif-alt), Georgia, serif" fontSize="11">
          {/* Poitrine — horizontal across bust */}
          <MeasureLine x1={85} y1={140} x2={215} y2={140} label="Poitrine" lx={250} ly={140} active={has("tourPoitrine")} value={mesures.tourPoitrine} />
          {/* Taille — narrower waist line */}
          <MeasureLine x1={108} y1={180} x2={192} y2={180} label="Taille" lx={250} ly={180} active={has("tourTaille")} value={mesures.tourTaille} />
          {/* Hanches — at hip level */}
          <MeasureLine x1={95} y1={205} x2={205} y2={205} label="Hanches" lx={250} ly={205} active={has("tourHanches")} value={mesures.tourHanches} />
          {/* Longueur robe — vertical from shoulder to hem */}
          <MeasureLine x1={40} y1={100} x2={40} y2={290} label="Long. robe" lx={5} ly={200} vertical active={has("longueurRobe")} value={mesures.longueurRobe} />
          {/* Épaule — small horizontal at top */}
          <MeasureLine x1={110} y1={100} x2={190} y2={100} label="Épaule" lx={250} ly={100} active={has("longueurEpaule")} value={mesures.longueurEpaule} />
          {/* Manche — diagonal arm reference */}
          <MeasureLine x1={190} y1={105} x2={225} y2={175} label="Manche" lx={250} ly={260} active={has("longueurManche")} value={mesures.longueurManche} />
          {/* Bras — small mark on upper arm */}
          <circle cx={215} cy={140} r={3} fill={has("tourBras") ? "#A9842D" : "none"} stroke="#A9842D" strokeWidth="1" />
          <line x1={215} y1={140} x2={265} y2={150} stroke="#A9842D" strokeDasharray="2 2" strokeWidth="0.7" />
          <text x={266} y={153} fill={has("tourBras") ? "#A9842D" : "#A9842D99"} fontSize="10">
            Bras{has("tourBras") ? ` · ${mesures.tourBras}cm` : ""}
          </text>
        </g>
      </svg>
    </div>
  );
}

function MeasureLine({
  x1, y1, x2, y2, label, lx, ly, vertical, active, value,
}: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; lx: number; ly: number;
  vertical?: boolean;
  active: boolean;
  value: string;
}) {
  const lineColor = active ? "#A9842D" : "#C9A24B66";
  const dotColor = active ? "#A9842D" : "#C9A24B66";
  const textColor = active ? "#A9842D" : "#A9842D88";
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth="1.2" strokeDasharray="3 2" />
      <circle cx={x1} cy={y1} r="2.2" fill={dotColor} />
      <circle cx={x2} cy={y2} r="2.2" fill={dotColor} />
      <line
        x1={vertical ? x1 : (x1 + x2) / 2}
        y1={vertical ? (y1 + y2) / 2 : y1}
        x2={vertical ? lx : lx}
        y2={vertical ? ly : ly}
        stroke={lineColor}
        strokeWidth="0.7"
        strokeDasharray="2 2"
      />
      <text
        x={lx + 2}
        y={ly + 3}
        fill={textColor}
        fontSize="10"
      >
        {label}{active ? ` · ${value}cm` : ""}
      </text>
    </g>
  );
}

/* ============== REASSURANCE ============== */
function Reassurance() {
  return (
    <section className="velvet py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <KhatimStar className="mx-auto h-8 w-8 text-gold/70" />
        <p className="mt-4 font-serif-alt text-xl sm:text-2xl text-ivory/90 italic">
          Vos mesures sont confidentielles et conservées avec soin pour vos
          futures commandes.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-gold/70">
          Discrétion · Fidélité · Savoir-faire
        </p>
      </div>
    </section>
  );
}

/* ============== SUCCESS SCREEN ============== */
function SuccessScreen({
  date,
  rdvType,
  onReset,
  goCollections,
}: {
  date: Date | undefined;
  rdvType: RdvType;
  onReset: () => void;
  goCollections: () => void;
}) {
  return (
    <section className="velvet-deep min-h-[70vh] flex items-center justify-center py-20">
      <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
        <NadiraMonogram className="mx-auto h-20 w-20" animate />
        <GoldDivider className="my-6" />
        <h2 className="font-display text-3xl sm:text-4xl text-gold-gradient">
          Votre demande de sur-mesure est enregistrée
        </h2>
        <p className="mt-4 text-ivory/80 leading-relaxed">
          Notre atelier vous contacte pour confirmer votre rendez-vous
          {date ? (
            <>
              {" "}
              du <span className="text-gold-light">{formatDate(date)}</span>
            </>
          ) : null}
          {rdvType === "essayage" ? " (essayage en atelier à Fès)." : " (consultation virtuelle)."}
        </p>
        <p className="mt-2 text-sm text-ivory/60">
          Vous recevrez une confirmation par téléphone dans les 48 heures ouvrées.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={goCollections}
            className="bg-gold text-emerald-deep hover:bg-gold-light"
          >
            Découvrir les collections
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="border-gold/40 text-gold-light hover:bg-gold/10"
          >
            Nouvelle demande
          </Button>
        </div>
      </div>
    </section>
  );
}
