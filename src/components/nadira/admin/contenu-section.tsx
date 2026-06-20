"use client";

/**
 * NADIRA Couture — Admin · Contenu éditorial section.
 */

import { useCallback, useEffect, useState } from "react";
import type { Contenu } from "@/lib/types";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

// lucide
import { Save } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";

/* ============================================================
   Contenu section
============================================================ */

const CONTENU_LABELS: Record<string, string> = {
  histoire_texte: "Histoire — Texte principal",
  histoire_accroche: "Histoire — Accroche",
  hero_accroche: "Accueil — Accroche Hero",
  atelier_texte: "Atelier — Texte",
  contact_adresse: "Contact — Adresse",
  contact_telephone: "Contact — Téléphone",
  contact_whatsapp: "Contact — WhatsApp",
  contact_email: "Contact — Email",
  contact_horaires: "Contact — Horaires",
  citation_1: "Citation #1",
  citation_2: "Citation #2",
  reseaux_instagram: "Réseaux — Instagram",
  reseaux_facebook: "Réseaux — Facebook",
  reseaux_pinterest: "Réseaux — Pinterest",
};

export function ContenuSection() {
  const [contenus, setContenus] = useState<Contenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

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

  async function save(c: Contenu) {
    setSaving(c.id);
    try {
      await adminApi("/api/contenu", {
        method: "PUT",
        body: JSON.stringify({
          cle: c.cle,
          valeur: edits[c.id] ?? c.valeur,
        }),
      });
      toast.success(
        `« ${CONTENU_LABELS[c.cle] || c.cle} » enregistré`
      );
      setEdits((e) => {
        const n = { ...e };
        delete n[c.id];
        return n;
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-emerald-deep">
          Contenu éditorial
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiez les textes affichés sur le site public
        </p>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {contenus.map((c) => {
            const val = edits[c.id] ?? c.valeur;
            const dirty = edits[c.id] !== undefined && edits[c.id] !== c.valeur;
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
                    disabled={saving === c.id || !dirty}
                    onClick={() => save(c)}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />{" "}
                    {saving === c.id ? "..." : "Enregistrer"}
                  </Button>
                </div>
                <Textarea
                  rows={val.length > 120 ? 4 : 2}
                  value={val}
                  onChange={(e) =>
                    setEdits({ ...edits, [c.id]: e.target.value })
                  }
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
