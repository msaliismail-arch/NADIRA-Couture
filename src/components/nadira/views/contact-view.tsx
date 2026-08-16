"use client";

import { useState } from "react";
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  Check,
  ArrowRight,
  User,
  Send,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { api, formatDate } from "@/lib/api";
import {
  NadiraMonogram,
  KhatimStar,
  GoldDivider,
} from "@/components/nadira/brand";
import { SOCIAL_ICON, SocialTiles } from "@/components/nadira/social-icons";
import { getSocialLinks, type SocialLink } from "@/lib/socials";
import { getAdresse } from "@/lib/maps";
import { MapPreview } from "@/components/nadira/map-preview";
import { useReveal } from "@/hooks/use-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function isValidPhone(tel: string) {
  const t = tel.replace(/[\s.-]/g, "");
  return /^(?:\+212|0)(?:[5-7]\d{8})$/.test(t);
}

export function ContactView({ contenu }: { contenu: Record<string, string> }) {
  const { setView } = useStore();

  const email = contenu.contact_email || "couture.nadira2026@gmail.com";
  const horaires = contenu.contact_horaires || "Tous les jours, toute l'année · 10h00–23h00";
  // Adresse de l'atelier + lien carte (généré si non renseigné en admin)
  const { adresse, mapsLink } = getAdresse(contenu);
  // Réseaux sociaux gérés depuis Admin → Contenu → Réseaux sociaux
  const socials = getSocialLinks({
    reseaux_instagram:
      "https://www.instagram.com/couture_nadira?igsh=bjZneDIzMGVudHBn",
    ...contenu,
  });

  // Form state
  const [nom, setNom] = useState("");
  const [emailField, setEmailField] = useState("");
  const [telField, setTelField] = useState("");
  const [sujet, setSujet] = useState<string>("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nom.trim()) e.nom = "Nom requis";
    if (!emailField.trim() && !telField.trim())
      e.contact = "Indiquez un e-mail ou un téléphone";
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField))
      e.email = "Adresse e-mail invalide";
    if (telField && !isValidPhone(telField))
      e.tel = "Format attendu : 06XXXXXXXX ou +212XXXXXXXXX";
    if (!sujet) e.sujet = "Veuillez choisir un sujet";
    if (!message.trim() || message.trim().length < 10)
      e.message = "Votre message (au moins 10 caractères)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Use rendezvous endpoint with type "consultation" — best available public endpoint.
      // Notes carry the subject + message so the atelier can triage.
      await api("/api/rendezvous", {
        method: "POST",
        body: JSON.stringify({
          nom,
          telephone: telField || "0000000000",
          email: emailField || undefined,
          dateRdv: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          type: "consultation",
          notes: `[${sujet}] ${message}`,
        }),
      });
      setSuccess(true);
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

  const mailLink = `mailto:${email}`;

  return (
    <div className="bg-background">
      <Hero />

      <section className="paper py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2">
          <ContactInfo
            adresse={adresse}
            email={email}
            horaires={horaires}
            socials={socials}
            mapsLink={mapsLink}
            mailLink={mailLink}
          />

          {success ? (
            <SuccessCard
              onReset={() => {
                setSuccess(false);
                setNom(""); setEmailField(""); setTelField("");
                setSujet(""); setMessage("");
              }}
              goSurMesure={() => setView("sur-mesure")}
            />
          ) : (
            <ContactForm
              nom={nom}
              setNom={setNom}
              email={emailField}
              setEmail={setEmailField}
              tel={telField}
              setTel={setTelField}
              sujet={sujet}
              setSujet={setSujet}
              message={message}
              setMessage={setMessage}
              errors={errors}
              submitting={submitting}
              onSubmit={submit}
            />
          )}
        </div>
      </section>

      <MapCard adresse={adresse} mapsLink={mapsLink} />

      <RDVCTA onSurMesure={() => setView("sur-mesure")} />
    </div>
  );
}

/* ============== HERO ============== */
function Hero() {
  const { ref, visible } = useReveal();
  return (
    <section className="velvet-deep relative overflow-hidden py-20 sm:py-24">
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
        <KhatimStar className="absolute -top-16 -left-16 h-80 w-80 text-gold khatim-spin" />
        <KhatimStar className="absolute -bottom-20 -right-16 h-72 w-72 text-gold khatim-spin" />
      </div>
      <div
        ref={ref}
        className={cn(
          "relative mx-auto max-w-4xl px-4 sm:px-6 text-center reveal",
          visible && "in-view"
        )}
      >
        <NadiraMonogram className="mx-auto h-14 w-14" animate />
        <h1 className="mt-6 font-display text-5xl sm:text-6xl text-gold-gradient font-semibold">
          Contact &amp; Boutique
        </h1>
        <p className="mt-4 font-serif-alt text-2xl sm:text-3xl text-ivory/90 italic">
          Notre atelier vous accueille à Agadir
        </p>
        <GoldDivider className="my-6" />
        <p className="mx-auto max-w-2xl text-ivory/70 leading-relaxed">
          Que vous souhaitiez visiter notre showroom, prendre un rendez-vous
          d'essayage ou simplement échanger sur une pièce, nos portes — et nos
          lignes — vous sont ouvertes.
        </p>
      </div>
    </section>
  );
}

/* ============== CONTACT INFO ============== */
function ContactInfo({
  adresse, email, horaires,
  socials, mapsLink, mailLink,
}: {
  adresse: string;
  email: string;
  horaires: string;
  socials: SocialLink[];
  mapsLink: string;
  mailLink: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={cn("reveal", visible && "in-view")}>
      <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
        Nous joindre
      </p>
      <h2 className="mt-3 font-display text-3xl text-emerald-deep">
        Coordonnées de l'atelier
      </h2>
      <GoldDivider className="!justify-start !my-6" />

      <div className="space-y-4">
        <InfoRow icon={MapPin} label="Adresse" value={adresse} href={mapsLink} />
        <InfoRow icon={Mail} label="E-mail" value={email} href={mailLink} />
        {socials.map((s) => (
          <InfoRow
            key={s.key}
            icon={SOCIAL_ICON[s.key]}
            label={s.label}
            value={s.display}
            href={s.href}
          />
        ))}
        <InfoRow icon={Clock} label="Horaires" value={horaires} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="bg-emerald-deep text-gold-light border border-gold/40 hover:bg-emerald-soft">
          <a href={mapsLink} target="_blank" rel="noreferrer">
            <MapPin className="h-4 w-4" /> Voir sur la carte
          </a>
        </Button>
        {socials.map((s) => {
          const Icon = SOCIAL_ICON[s.key];
          return (
            <Button
              key={s.key}
              asChild
              variant="outline"
              className="border-gold/40 text-emerald-deep hover:bg-gold/10"
            >
              <a href={s.href} target="_blank" rel="noreferrer">
                <Icon className="h-4 w-4" /> {s.label}
              </a>
            </Button>
          );
        })}
      </div>

      <Separator className="my-6 bg-gold/20" />

      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gold-deep mb-3">
          Suivez la maison
        </p>
        <SocialTiles links={socials} variant="light" />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="h-10 w-10 shrink-0 rounded-full velvet-deep flex items-center justify-center border border-gold/30">
        <Icon className="h-4 w-4 text-gold-light" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-deep">
          {label}
        </p>
        <p className="text-sm text-foreground/85 mt-0.5 break-words">
          {value}
        </p>
      </div>
    </>
  );
  return href ? (
    <a
      href={href}
      className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-white/50 transition-colors"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
    >
      {content}
    </a>
  ) : (
    <div className="flex items-start gap-3 p-2 -mx-2">
      {content}
    </div>
  );
}

/* ============== CONTACT FORM ============== */
function ContactForm(props: {
  nom: string; setNom: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  tel: string; setTel: (v: string) => void;
  sujet: string; setSujet: (v: string) => void;
  message: string; setMessage: (v: string) => void;
  errors: Record<string, string>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const {
    nom, setNom, email, setEmail, tel, setTel,
    sujet, setSujet, message, setMessage,
    errors, submitting, onSubmit,
  } = props;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gold/25 bg-white/70 p-6 sm:p-8 shadow-sm"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">
        Écrivez-nous
      </p>
      <h2 className="mt-3 font-display text-3xl text-emerald-deep">
        Formulaire de contact
      </h2>
      <GoldDivider className="!justify-start !my-5" />

      <div className="space-y-5">
        <div>
          <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
            Nom complet <span className="text-gold-deep">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-deep/70" />
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              className="pl-9"
              aria-invalid={!!errors.nom}
            />
          </div>
          {errors.nom && <p className="mt-1 text-xs text-destructive">{errors.nom}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-deep/70" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="pl-9"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
              Téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-deep/70" />
              <Input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="06 12 34 56 78"
                className="pl-9"
                aria-invalid={!!errors.tel}
              />
            </div>
            {errors.tel && <p className="mt-1 text-xs text-destructive">{errors.tel}</p>}
          </div>
        </div>
        {errors.contact && (
          <p className="text-xs text-destructive -mt-2">{errors.contact}</p>
        )}

        <div>
          <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
            Sujet <span className="text-gold-deep">*</span>
          </Label>
          <Select value={sujet} onValueChange={setSujet}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.sujet}>
              <SelectValue placeholder="Choisir un sujet..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Information produit">Information produit</SelectItem>
              <SelectItem value="Rendez-vous">Rendez-vous</SelectItem>
              <SelectItem value="Sur-mesure">Sur-mesure</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
          {errors.sujet && <p className="mt-1 text-xs text-destructive">{errors.sujet}</p>}
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-emerald-deep/80 mb-1.5 block">
            Message <span className="text-gold-deep">*</span>
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre demande..."
            className="min-h-32"
            aria-invalid={!!errors.message}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-destructive">{errors.message}</p>
          )}
        </div>

        {errors.submit && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 velvet-deep text-gold-light border border-gold/40 hover:bg-emerald-soft"
        >
          {submitting ? (
            <span className="animate-pulse">Envoi en cours…</span>
          ) : (
            <>
              Envoyer le message
              <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/* ============== SUCCESS CARD ============== */
function SuccessCard({
  onReset,
  goSurMesure,
}: {
  onReset: () => void;
  goSurMesure: () => void;
}) {
  const today = new Date();
  const dateLabel = formatDate(today);
  return (
    <div className="rounded-2xl border border-gold/40 velvet-deep p-8 sm:p-10 text-center flex flex-col justify-center">
      <NadiraMonogram className="mx-auto h-16 w-16" animate />
      <GoldDivider className="my-6" />
      <h2 className="font-display text-3xl text-gold-gradient">
        Message reçu
      </h2>
      <p className="mt-4 text-ivory/85 leading-relaxed">
        Merci de nous avoir écrit. Nous revenons vers vous sous 48 heures ouvrées,
        à compter du <span className="text-gold-light">{dateLabel}</span>.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ivory/70">
        <Check className="h-4 w-4 text-gold-light" />
        Demande enregistrée auprès de l'atelier.
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={goSurMesure}
          className="bg-gold text-emerald-deep hover:bg-gold-light"
        >
          Prendre un rendez-vous sur-mesure
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="border-gold/40 text-gold-light hover:bg-gold/10"
        >
          Nouveau message
        </Button>
      </div>
    </div>
  );
}

/* ============== MAP CARD ============== */
function MapCard({
  adresse,
  mapsLink,
}: {
  adresse: string;
  mapsLink: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <section className="paper py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={cn(
            "overflow-hidden rounded-2xl border-2 border-gold/30 velvet-deep p-6 sm:p-8 reveal",
            visible && "in-view"
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <KhatimStar className="h-14 w-14 text-gold" strokeWidth={1.2} />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-gold-light" />
              </div>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gold-light/80">
              Atelier NADIRA
            </p>
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              title={`Ouvrir \u00ab\u00a0${adresse}\u00a0\u00bb dans Google Maps`}
              className="mt-2 font-serif-alt text-xl sm:text-2xl text-ivory italic underline decoration-gold/50 decoration-1 underline-offset-4 hover:text-gold-light hover:decoration-gold transition-colors"
            >
              {adresse}
            </a>
          </div>

          {/* Vraie carte + itin\u00e9raire */}
          <MapPreview
            adresse={adresse}
            mapsLink={mapsLink}
            variant="dark"
            className="mt-6"
            height="h-72 sm:h-96"
          />
        </div>
      </div>
    </section>
  );
}

/* ============== RDV CTA ============== */
function RDVCTA({ onSurMesure }: { onSurMesure: () => void }) {
  return (
    <section className="velvet py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <KhatimStar className="mx-auto h-8 w-8 text-gold/70" />
        <h2 className="mt-4 font-display text-3xl sm:text-4xl text-gold-gradient">
          Prendre rendez-vous à l'atelier
        </h2>
        <p className="mt-3 text-ivory/70">
          Visiter la maison, essayer une pièce, dessiner ensemble votre caftan —
          le rendez-vous est la première étape.
        </p>
        <Button
          onClick={onSurMesure}
          className="mt-8 bg-gold text-emerald-deep hover:bg-gold-light h-12 px-8 text-base"
        >
          Réserver un essayage
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
