"use client";

/**
 * NADIRA Couture — Admin · Galerie photos section.
 * Includes GalerieAddDialog (private to this file).
 */

import { useCallback, useEffect, useState } from "react";
import type { Galerie } from "@/lib/types";
import { api, normalizeImageUrl } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// lucide
import { Plus, Trash2, Upload } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import {
  adminApi,
  getToken,
  GALERIE_CATEGORIES,
  GALERIE_CAT_COLORS,
} from "./admin-shared";

/* ============================================================
   Galerie section
============================================================ */

export function GalerieSection() {
  const [photos, setPhotos] = useState<Galerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Galerie | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api<Galerie[]>("/api/galerie")
      .then(setPhotos)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await adminApi(`/api/galerie/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Photo supprimée");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-emerald-deep">
            Galerie photos
          </h1>
          <p className="text-sm text-muted-foreground">
            {photos.length} photo{photos.length > 1 ? "s" : ""} publiée
            {photos.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter une photo
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Aucune photo pour le moment. Cliquez sur « Ajouter une photo » pour
          commencer.
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <Card key={p.id} className="overflow-hidden p-0 group">
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={normalizeImageUrl(p.url)}
                  alt={p.legende || "Photo galerie"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    t.style.display = "none";
                  }}
                />
              </div>
              <div className="p-3 space-y-2">
                {p.categorie && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${
                      GALERIE_CAT_COLORS[p.categorie] ||
                      "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {p.categorie}
                  </span>
                )}
                {p.legende && (
                  <p className="text-sm text-foreground/90 line-clamp-2">
                    {p.legende}
                  </p>
                )}
                <div className="flex justify-end pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 w-8 p-0"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <GalerieAddDialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) load();
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer cette photo ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La photo sera
              définitivement retirée de la galerie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ============================================================
   Galerie add dialog (file upload)
============================================================ */

function GalerieAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legende, setLegende] = useState("");
  const [categorie, setCategorie] = useState<string>("Atelier");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) return;
    setFile(null);
    setPreview(null);
    setLegende("");
    setCategorie("Atelier");
  }, [open]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    if (!file) {
      toast.error("Sélectionnez une image");
      return;
    }
    setSaving(true);
    try {
      // 1. Upload the file (FormData) — manual fetch because adminApi
      //    forces Content-Type: application/json which breaks multipart.
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);
      const upRes = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!upRes.ok) {
        let msg = `Erreur ${upRes.status}`;
        try {
          const d = await upRes.json();
          msg = d.error || msg;
        } catch {
          /* noop */
        }
        throw new Error(msg);
      }
      const { url } = (await upRes.json()) as { url: string };

      // 2. Create the galerie entry
      await adminApi<Galerie>("/api/galerie", {
        method: "POST",
        body: JSON.stringify({
          url,
          legende: legende || null,
          categorie: categorie || null,
        }),
      });
      toast.success("Photo ajoutée à la galerie");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une photo</DialogTitle>
          <DialogDescription>
            Téléversez une image depuis votre ordinateur.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Image *</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:border-emerald/40 hover:bg-muted/30 transition-colors">
              {preview ? (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="max-h-48 mx-auto rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour choisir une image
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    JPG, PNG, WEBP — 10 Mo max
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onFileChange}
              />
            </label>
            {file && (
              <p className="text-xs text-muted-foreground truncate">
                {file.name} ({Math.round(file.size / 1024)} Ko)
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Légende</Label>
            <Input
              value={legende}
              onChange={(e) => setLegende(e.target.value)}
              placeholder="Description courte (optionnel)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GALERIE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !file}
            className="bg-emerald hover:bg-emerald-deep text-ivory"
          >
            {saving ? "Téléversement..." : "Publier la photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
