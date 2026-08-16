"use client";

/**
 * NADIRA Couture — Admin · Contenu éditorial section.
 * Includes a dedicated "Notre Histoire" editor with image upload.
 */

import { useCallback, useEffect, useState } from "react";
import type { Contenu } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/api";
import {
  SOCIAL_KEYS,
  SOCIAL_CONTENT_KEY,
  SOCIAL_KEYS_CONTENU,
  SOCIAL_LABEL,
  SOCIAL_PLACEHOLDER,
  SOCIAL_HINT,
  normalizeSocialUrl,
} from "@/lib/socials";
import { SOCIAL_ICON } from "@/components/nadira/social-icons";
import { ADRESSE_ATELIER, mapsUrl } from "@/lib/maps";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// lucide
import {
  Save,
  Upload,
  X,
  BookOpen,
  ImageIcon,
  Share2,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";

/* ============================================================
   Contenu section
============================================================ */

const CONTENU_LABELS: Record<string, string> = {
  histoire_texte: "Histoire — Texte principal (Chapitre I)",
  histoire_accroche: "Histoire — Accroche (sous-titre hero)",
  histoire_ch1_titre: "Histoire — Titre Chapitre I",
  histoire_ch2_titre: "Histoire — Titre Chapitre II",
  histoire_ch2_texte: "Histoire — Texte Chapitre II",
  histoire_ch3_titre: "Histoire — Titre Chapitre III",
  histoire_ch3_texte: "Histoire — Texte Chapitre III",
  hero_accroche: "Accueil — Accroche Hero",
  hero_accueil_image: "Accueil — Photo Hero (plein écran)",
  histoire_accueil_image: "Accueil — Photo section Notre Histoire",
  atelier_texte: "Atelier — Texte",
  contact_adresse: "Contact — Adresse",
  contact_maps: "Contact — Lien carte",
  contact_email: "Contact — Email",
  contact_telephone: "Contact — Téléphone",
  contact_horaires: "Contact — Horaires",
  citation_1: "Citation #1",
  citation_2: "Citation #2",
  reseaux_instagram: "Réseaux — Instagram",
  reseaux_tiktok: "Réseaux — TikTok",
  reseaux_facebook: "Réseaux — Facebook",
  reseaux_whatsapp: "Réseaux — WhatsApp",
};

/** Clés gérées par l'éditeur dédié « Réseaux sociaux ». */
const RESEAUX_KEYS = SOCIAL_KEYS_CONTENU;

/** Clés gérées par l'éditeur dédié « Coordonnées de la maison ». */
const COORDONNEES_KEYS = [
  "contact_adresse",
  "contact_maps",
  "contact_email",
  "contact_telephone",
  "contact_horaires",
];

// Content keys that belong to the "Notre Histoire" editor
const HISTOIRE_KEYS = [
  "histoire_accroche",
  "histoire_texte",
  "histoire_ch1_titre",
  "histoire_ch1_image",
  "histoire_ch2_titre",
  "histoire_ch2_texte",
  "histoire_ch2_image",
  "histoire_ch3_titre",
  "histoire_ch3_texte",
  "histoire_ch3_image",
];

const HISTOIRE_FIELD_LABELS: Record<string, string> = {
  histoire_accroche: "Accroche (sous-titre du hero)",
  histoire_texte: "Texte du Chapitre I",
  histoire_ch1_titre: "Titre du Chapitre I",
  histoire_ch1_image: "Image du Chapitre I",
  histoire_ch2_titre: "Titre du Chapitre II",
  histoire_ch2_texte: "Texte du Chapitre II",
  histoire_ch2_image: "Image du Chapitre II",
  histoire_ch3_titre: "Titre du Chapitre III",
  histoire_ch3_texte: "Texte du Chapitre III",
  histoire_ch3_image: "Image du Chapitre III",
};

const IMAGE_KEYS = new Set([
  "histoire_ch1_image",
  "histoire_ch2_image",
  "histoire_ch3_image",
  "hero_accueil_image",
  "histoire_accueil_image",
]);

export function ContenuSection() {
  const [contenus, setContenus] = useState<Contenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<Contenu[]>("/api/contenu")
      .then(setContenus)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Build a map of cle -> valeur (from DB, merged with local edits)
  const contenuMap: Record<string, string> = {};
  for (const c of contenus) {
    contenuMap[c.cle] = c.valeur;
  }
  // Apply local edits
  for (const [k, v] of Object.entries(edits)) {
    contenuMap[k] = v;
  }

  // Ensure all histoire keys exist in the map (even if not in DB yet)
  for (const k of HISTOIRE_KEYS) {
    if (!(k in contenuMap)) contenuMap[k] = "";
  }
  // Same for the social network + contact keys
  for (const k of [...RESEAUX_KEYS, ...COORDONNEES_KEYS]) {
    if (!(k in contenuMap)) contenuMap[k] = "";
  }

  async function saveKey(cle: string) {
    const valeur = contenuMap[cle] ?? "";
    setSaving(cle);
    try {
      await adminApi("/api/contenu", {
        method: "PUT",
        body: JSON.stringify({ cle, valeur }),
      });
      toast.success(`« ${HISTOIRE_FIELD_LABELS[cle] || CONTENU_LABELS[cle] || cle} » enregistré`);
      // Remove from edits since it's now saved
      setEdits((e) => {
        const n = { ...e };
        delete n[cle];
        return n;
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  async function saveAllHistoire() {
    setSaving("histoire_all");
    try {
      for (const key of HISTOIRE_KEYS) {
        const valeur = contenuMap[key] ?? "";
        await adminApi("/api/contenu", {
          method: "PUT",
          body: JSON.stringify({ cle: key, valeur }),
        });
      }
      toast.success("Notre Histoire mise à jour");
      setEdits((e) => {
        const n = { ...e };
        for (const k of HISTOIRE_KEYS) delete n[k];
        return n;
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  async function saveAllReseaux() {
    setSaving("reseaux_all");
    try {
      for (const key of RESEAUX_KEYS) {
        const valeur = (contenuMap[key] ?? "").trim();
        await adminApi("/api/contenu", {
          method: "PUT",
          body: JSON.stringify({ cle: key, valeur }),
        });
      }
      toast.success("Réseaux sociaux mis à jour");
      setEdits((e) => {
        const n = { ...e };
        for (const k of RESEAUX_KEYS) delete n[k];
        return n;
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  async function saveAllCoordonnees() {
    setSaving("coordonnees_all");
    try {
      for (const key of COORDONNEES_KEYS) {
        const valeur = (contenuMap[key] ?? "").trim();
        await adminApi("/api/contenu", {
          method: "PUT",
          body: JSON.stringify({ cle: key, valeur }),
        });
      }
      toast.success("Coordonnées mises à jour");
      setEdits((e) => {
        const n = { ...e };
        for (const k of COORDONNEES_KEYS) delete n[k];
        return n;
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  // Upload an image for a histoire chapter
  async function handleImageUpload(key: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image dépasse 10 Mo");
      return;
    }
    setUploadingKey(key);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nadira-admin-token") : null;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Échec de l'upload");
        return;
      }
      const data = await res.json();
      setEdits((e) => ({ ...e, [key]: data.url }));
      toast.success("Image téléversée — n'oubliez pas d'enregistrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploadingKey(null);
    }
  }

  const histoireDirty = HISTOIRE_KEYS.some(
    (k) => edits[k] !== undefined && edits[k] !== (contenus.find((c) => c.cle === k)?.valeur ?? "")
  );

  const reseauxDirty = RESEAUX_KEYS.some(
    (k) => edits[k] !== undefined && edits[k] !== (contenus.find((c) => c.cle === k)?.valeur ?? "")
  );

  const coordonneesDirty = COORDONNEES_KEYS.some(
    (k) => edits[k] !== undefined && edits[k] !== (contenus.find((c) => c.cle === k)?.valeur ?? "")
  );

  // Split contenus: histoire, réseaux and coordonnées keys are shown in
  // dedicated editors, the rest in the general editor below
  const generalContenus = contenus.filter(
    (c) =>
      !HISTOIRE_KEYS.includes(c.cle) &&
      !RESEAUX_KEYS.includes(c.cle) &&
      !COORDONNEES_KEYS.includes(c.cle)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-emerald-deep">
          Contenu éditorial
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiez les textes et images affichés sur le site public
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* ====== Notre Histoire Editor ====== */}
          <Card className="p-5 border-2 border-gold/30">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-gold-deep" />
              <h2 className="font-display text-xl text-emerald-deep">
                Notre Histoire
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Modifiez le titre, les chapitres et les images de la page « Notre
              Histoire ». Les changements apparaissent immédiatement sur le site
              public après enregistrement.
            </p>

            <div className="space-y-4">
              {/* Accroche */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-gold-deep">
                  {HISTOIRE_FIELD_LABELS.histoire_accroche}
                </Label>
                <Input
                  value={contenuMap.histoire_accroche ?? ""}
                  onChange={(e) =>
                    setEdits({ ...edits, histoire_accroche: e.target.value })
                  }
                  placeholder="Trois générations de mains qui brodent l'âme du Maroc."
                />
              </div>

              {/* Chapter 1 */}
              <ChapterEditor
                number="I"
                titreKey="histoire_ch1_titre"
                texteKey="histoire_texte"
                imageKey="histoire_ch1_image"
                values={contenuMap}
                onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                onUpload={handleImageUpload}
                uploading={uploadingKey}
              />

              {/* Chapter 2 */}
              <ChapterEditor
                number="II"
                titreKey="histoire_ch2_titre"
                texteKey="histoire_ch2_texte"
                imageKey="histoire_ch2_image"
                values={contenuMap}
                onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                onUpload={handleImageUpload}
                uploading={uploadingKey}
              />

              {/* Chapter 3 */}
              <ChapterEditor
                number="III"
                titreKey="histoire_ch3_titre"
                texteKey="histoire_ch3_texte"
                imageKey="histoire_ch3_image"
                values={contenuMap}
                onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                onUpload={handleImageUpload}
                uploading={uploadingKey}
              />
            </div>

            <div className="flex justify-end mt-5">
              <Button
                className="bg-emerald hover:bg-emerald-deep text-ivory"
                disabled={saving === "histoire_all" || !histoireDirty}
                onClick={saveAllHistoire}
              >
                <Save className="w-4 h-4 mr-1" />
                {saving === "histoire_all" ? "Enregistrement..." : "Enregistrer Notre Histoire"}
              </Button>
            </div>
          </Card>

          {/* ====== Photos de la page d'accueil ====== */}
          <Card className="p-5 border-2 border-gold/30">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-gold-deep" />
              <h2 className="font-display text-xl text-emerald-deep">
                Photos de la page d&apos;accueil
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Modifiez les photos affichées sur la page d&apos;accueil :
              la grande image hero (plein écran) et la photo de la section « Notre Histoire ».
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hero image */}
              <PhotoEditor
                label="Photo Hero (plein écran)"
                description="La grande image de fond en haut de la page d'accueil"
                contentKey="hero_accueil_image"
                defaultUrl="/images/hero-atelier.jpg"
                values={contenuMap}
                onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                onUpload={handleImageUpload}
                uploading={uploadingKey}
                onSave={() => saveKey("hero_accueil_image")}
                saving={saving}
              />
              {/* Histoire teaser image */}
              <PhotoEditor
                label="Photo section Notre Histoire"
                description="La photo encadrée à côté du texte « Notre Histoire »"
                contentKey="histoire_accueil_image"
                defaultUrl="/images/atelier-heritage.jpg"
                values={contenuMap}
                onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                onUpload={handleImageUpload}
                uploading={uploadingKey}
                onSave={() => saveKey("histoire_accueil_image")}
                saving={saving}
              />
            </div>
          </Card>

          {/* ====== Coordonnées de la maison ====== */}
          <Card className="p-5 border-2 border-gold/30">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gold-deep" />
              <h2 className="font-display text-xl text-emerald-deep">
                Coordonnées de la maison
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Adresse, carte, e-mail, téléphone et horaires affichés sur le site
              (page Contact, bas de page, espace client). L&apos;adresse est
              cliquable sur le site et ouvre la carte.
            </p>

            <div className="space-y-4">
              {/* Adresse + lien carte */}
              <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-gold-deep">
                    Adresse de l&apos;atelier
                  </Label>
                  <Input
                    value={contenuMap.contact_adresse ?? ""}
                    placeholder={ADRESSE_ATELIER}
                    onChange={(e) =>
                      setEdits({ ...edits, contact_adresse: e.target.value })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Affichée sur la carte de la page Contact, dans le bas de page
                    et sur la page Sur-Mesure.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-gold-deep">
                    Lien de la carte (facultatif)
                  </Label>
                  <Input
                    value={contenuMap.contact_maps ?? ""}
                    placeholder="Laissez vide : le lien Google Maps est généré depuis l'adresse"
                    onChange={(e) =>
                      setEdits({ ...edits, contact_maps: e.target.value })
                    }
                  />
                  <a
                    href={
                      (contenuMap.contact_maps ?? "").trim() ||
                      mapsUrl(contenuMap.contact_adresse ?? "")
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gold-deep hover:underline break-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    Tester le lien de la carte
                  </a>
                </div>
              </div>

              {/* E-mail / téléphone / horaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContactField
                  icon={Mail}
                  label="E-mail"
                  contentKey="contact_email"
                  placeholder="couture.nadira2026@gmail.com"
                  hint="Cliquable sur le site : ouvre la messagerie du visiteur."
                  values={contenuMap}
                  onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                  preview={(v) => (v ? `mailto:${v}` : null)}
                />
                <ContactField
                  icon={Phone}
                  label="Téléphone"
                  contentKey="contact_telephone"
                  placeholder="+212 5 35 63 42 18"
                  hint="Cliquable sur mobile : lance l'appel."
                  values={contenuMap}
                  onEdit={(k, v) => setEdits({ ...edits, [k]: v })}
                  preview={(v) =>
                    v ? `tel:${v.replace(/[^\d+]/g, "")}` : null
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-gold-deep">
                  Horaires d&apos;ouverture
                </Label>
                <Input
                  value={contenuMap.contact_horaires ?? ""}
                  placeholder="Tous les jours, toute l'année · 10h00–23h00"
                  onChange={(e) =>
                    setEdits({ ...edits, contact_horaires: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <Button
                className="bg-emerald hover:bg-emerald-deep text-ivory"
                disabled={saving === "coordonnees_all" || !coordonneesDirty}
                onClick={saveAllCoordonnees}
              >
                <Save className="w-4 h-4 mr-1" />
                {saving === "coordonnees_all"
                  ? "Enregistrement..."
                  : "Enregistrer les coordonnées"}
              </Button>
            </div>
          </Card>

          {/* ====== Réseaux sociaux ====== */}
          <Card className="p-5 border-2 border-gold/30">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-gold-deep" />
              <h2 className="font-display text-xl text-emerald-deep">
                Réseaux sociaux
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Renseignez ici les liens de vos réseaux. Les logos affichés sur le
              site (bas de page et page Contact) deviennent automatiquement
              cliquables et pointent vers l&apos;adresse saisie. Laissez un champ
              vide pour masquer le logo correspondant.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SOCIAL_KEYS.map((key) => {
                const cle = SOCIAL_CONTENT_KEY[key];
                const raw = contenuMap[cle] ?? "";
                const href = normalizeSocialUrl(key, raw);
                const Icon = SOCIAL_ICON[key];
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-border p-4 space-y-2 bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 shrink-0 rounded-full border border-gold/40 flex items-center justify-center text-emerald-deep">
                        <Icon className="w-4 h-4" />
                      </span>
                      <Label className="text-sm font-medium text-emerald-deep">
                        {SOCIAL_LABEL[key]}
                      </Label>
                    </div>
                    <Input
                      value={raw}
                      placeholder={SOCIAL_PLACEHOLDER[key]}
                      onChange={(e) =>
                        setEdits({ ...edits, [cle]: e.target.value })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {SOCIAL_HINT[key]}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-gold-deep hover:underline break-all"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {href}
                      </a>
                    ) : raw.trim() ? (
                      <p className="text-[11px] text-destructive">
                        Valeur non reconnue — vérifiez le lien.
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Non renseigné — le logo sera masqué sur le site.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-5">
              <Button
                className="bg-emerald hover:bg-emerald-deep text-ivory"
                disabled={saving === "reseaux_all" || !reseauxDirty}
                onClick={saveAllReseaux}
              >
                <Save className="w-4 h-4 mr-1" />
                {saving === "reseaux_all"
                  ? "Enregistrement..."
                  : "Enregistrer les réseaux"}
              </Button>
            </div>
          </Card>

          {/* ====== General Content Editor ====== */}
          <div className="space-y-3">
            <h2 className="font-display text-lg text-emerald-deep mt-6">
              Autres contenus
            </h2>
            {generalContenus.filter((c) => !["hero_accueil_image", "histoire_accueil_image"].includes(c.cle)).map((c) => {
              const val = edits[c.cle] ?? c.valeur;
              const dirty = edits[c.cle] !== undefined && edits[c.cle] !== c.valeur;
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-sm text-emerald-deep">
                        {CONTENU_LABELS[c.cle] || c.cle}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {c.cle}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald hover:bg-emerald-deep text-ivory"
                      disabled={saving === c.cle || !dirty}
                      onClick={() => saveKey(c.cle)}
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />{" "}
                      {saving === c.cle ? "..." : "Enregistrer"}
                    </Button>
                  </div>
                  <Textarea
                    rows={val.length > 120 ? 4 : 2}
                    value={val}
                    onChange={(e) =>
                      setEdits({ ...edits, [c.cle]: e.target.value })
                    }
                  />
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   ContactField — un champ de coordonnées avec aperçu du lien
============================================================ */
function ContactField({
  icon: Icon,
  label,
  contentKey,
  placeholder,
  hint,
  values,
  onEdit,
  preview,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  contentKey: string;
  placeholder: string;
  hint: string;
  values: Record<string, string>;
  onEdit: (key: string, value: string) => void;
  preview: (value: string) => string | null;
}) {
  const value = (values[contentKey] ?? "").trim();
  const href = preview(value);

  return (
    <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="h-8 w-8 shrink-0 rounded-full border border-gold/40 flex items-center justify-center text-emerald-deep">
          <Icon className="w-4 h-4" />
        </span>
        <Label className="text-sm font-medium text-emerald-deep">{label}</Label>
      </div>
      <Input
        value={values[contentKey] ?? ""}
        placeholder={placeholder}
        onChange={(e) => onEdit(contentKey, e.target.value)}
      />
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      {href ? (
        <a
          href={href}
          className="inline-flex items-center gap-1 text-[11px] text-gold-deep hover:underline break-all"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          {href}
        </a>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">
          Non renseigné — masqué sur le site.
        </p>
      )}
    </div>
  );
}

/* ============================================================
   ChapterEditor — title + text + image upload for one chapter
============================================================ */
function ChapterEditor({
  number,
  titreKey,
  texteKey,
  imageKey,
  values,
  onEdit,
  onUpload,
  uploading,
}: {
  number: string;
  titreKey: string;
  texteKey: string;
  imageKey: string;
  values: Record<string, string>;
  onEdit: (key: string, value: string) => void;
  onUpload: (key: string, files: FileList | null) => void;
  uploading: string | null;
}) {
  const imageUrl = values[imageKey] ?? "";

  return (
    <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-deep font-medium">
        Chapitre {number}
      </p>

      {/* Title */}
      <div className="space-y-1">
        <Label className="text-xs">Titre</Label>
        <Input
          value={values[titreKey] ?? ""}
          onChange={(e) => onEdit(titreKey, e.target.value)}
          placeholder="Titre du chapitre"
        />
      </div>

      {/* Text */}
      <div className="space-y-1">
        <Label className="text-xs">Texte</Label>
        <Textarea
          rows={4}
          value={values[texteKey] ?? ""}
          onChange={(e) => onEdit(texteKey, e.target.value)}
          placeholder="Texte du chapitre..."
        />
      </div>

      {/* Image upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Image</Label>
        <div className="flex flex-wrap gap-3 items-start">
          {imageUrl && (
            <div className="relative w-24 h-24 rounded-md overflow-hidden border border-border group">
              <img
                src={normalizeImageUrl(imageUrl)}
                alt={`Chapitre ${number}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onEdit(imageKey, "")}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Supprimer l'image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-xs text-emerald-deep hover:bg-gold/10 hover:border-gold/60 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            {uploading === imageKey ? "Upload..." : imageUrl ? "Remplacer" : "Téléverser"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onUpload(imageKey, e.target.files);
                e.target.value = "";
              }}
              disabled={uploading === imageKey}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PhotoEditor — editable photo with upload, preview, save
   Used for homepage images (hero, histoire teaser)
============================================================ */
function PhotoEditor({
  label,
  description,
  contentKey,
  defaultUrl,
  values,
  onEdit,
  onUpload,
  uploading,
  onSave,
  saving,
}: {
  label: string;
  description: string;
  contentKey: string;
  defaultUrl: string;
  values: Record<string, string>;
  onEdit: (key: string, value: string) => void;
  onUpload: (key: string, files: FileList | null) => void;
  uploading: string | null;
  onSave: () => void;
  saving: string | null;
}) {
  const rawUrl = values[contentKey] ?? "";
  const imageUrl = rawUrl || defaultUrl;
  const isDirty = rawUrl !== "" && rawUrl !== defaultUrl;
  const isUploading = uploading === contentKey;

  return (
    <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
      <div>
        <p className="font-medium text-sm text-emerald-deep">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {/* Preview */}
      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden border border-border bg-muted">
        <img
          src={normalizeImageUrl(imageUrl)}
          alt={label}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => onEdit(contentKey, "")}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
          aria-label="Réinitialiser la photo"
          title="Réinitialiser"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Upload + Save */}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border-2 border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-xs text-emerald-deep hover:bg-gold/10 hover:border-gold/60 transition-colors">
          <Upload className="w-3.5 h-3.5" />
          {isUploading ? "Upload..." : "Téléverser"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onUpload(contentKey, e.target.files);
              e.target.value = "";
            }}
            disabled={isUploading}
          />
        </label>
        <Button
          size="sm"
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          disabled={saving === contentKey || !isDirty}
          onClick={onSave}
        >
          <Save className="w-3 h-3 mr-1" />
          {saving === contentKey ? "..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
