"use client";

/**
 * NADIRA Couture — Admin · Artisans section.
 * Includes ArtisanFormDialog (private to this file).
 */

import { useCallback, useEffect, useState } from "react";
import type { Artisan } from "@/lib/types";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { Plus, Edit, Trash2 } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";

/* ============================================================
   Artisans section
============================================================ */

export function ArtisansSection() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Artisan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteArtisan, setDeleteArtisan] = useState<Artisan | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<Artisan[]>("/api/artisans")
      .then(setArtisans)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteArtisan) return;
    try {
      await adminApi(`/api/artisans/${deleteArtisan.id}`, {
        method: "DELETE",
      });
      toast.success("Artisan supprimé");
      setDeleteArtisan(null);
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
            Artisans
          </h1>
          <p className="text-sm text-muted-foreground">
            {artisans.length} artisan{artisans.length > 1 ? "s" : ""} de
            l&apos;atelier
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          onClick={() => {
            setEdit(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter un artisan
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {artisans.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-emerald-deep">
                    {a.nom}
                  </p>
                  <p className="text-sm text-gold-deep">{a.specialite}</p>
                  {a.biographie && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {a.biographie}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEdit(a);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteArtisan(a)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ArtisanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        artisan={edit}
        onSaved={load}
      />

      <AlertDialog
        open={!!deleteArtisan}
        onOpenChange={(o) => !o && setDeleteArtisan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet artisan ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteArtisan?.nom} » sera définitivement supprimé.
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
   Artisan form dialog
============================================================ */

function ArtisanFormDialog({
  open,
  onOpenChange,
  artisan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  artisan: Artisan | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nom: "",
    specialite: "",
    biographie: "",
    photo: "",
    ordre: "0",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (artisan) {
      setForm({
        nom: artisan.nom,
        specialite: artisan.specialite,
        biographie: artisan.biographie || "",
        photo: artisan.photo || "",
        ordre: String(artisan.ordre),
      });
    } else {
      setForm({
        nom: "",
        specialite: "",
        biographie: "",
        photo: "",
        ordre: "0",
      });
    }
  }, [artisan, open]);

  async function save() {
    if (!form.nom || !form.specialite) {
      toast.error("Nom et spécialité requis");
      return;
    }
    setSaving(true);
    const body = {
      nom: form.nom,
      specialite: form.specialite,
      biographie: form.biographie || null,
      photo: form.photo || null,
      ordre: Number(form.ordre) || 0,
    };
    try {
      if (artisan) {
        await adminApi(`/api/artisans/${artisan.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Artisan mis à jour");
      } else {
        await adminApi("/api/artisans", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Artisan créé");
      }
      onOpenChange(false);
      onSaved();
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
          <DialogTitle>
            {artisan ? "Modifier l'artisan" : "Nouvel artisan"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nom *</Label>
            <Input
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Spécialité *</Label>
            <Input
              value={form.specialite}
              onChange={(e) =>
                setForm({ ...form, specialite: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Biographie</Label>
            <Textarea
              rows={3}
              value={form.biographie}
              onChange={(e) =>
                setForm({ ...form, biographie: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ordre</Label>
              <Input
                type="number"
                value={form.ordre}
                onChange={(e) => setForm({ ...form, ordre: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Photo URL</Label>
              <Input
                value={form.photo}
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-emerald hover:bg-emerald-deep text-ivory"
          >
            {saving ? "..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
