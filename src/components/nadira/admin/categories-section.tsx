"use client";

/**
 * NADIRA Couture — Admin · Catégories section.
 * Create, edit, delete product categories.
 */

import { useCallback, useEffect, useState } from "react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// lucide
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";
import { api } from "@/lib/api";

type CategorieAvecCount = {
  id: number;
  libelle: string;
  slug: string;
  ordre: number;
  _count?: { produits: number };
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<CategorieAvecCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<CategorieAvecCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategorieAvecCount | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api<CategorieAvecCount[]>("/api/categories")
      .then(setCategories)
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
      await adminApi(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Catégorie supprimée");
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
          <h1 className="font-display text-2xl text-emerald-deep flex items-center gap-2">
            <FolderOpen className="w-6 h-6" />
            Catégories
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""} au catalogue
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          onClick={() => {
            setEditCat(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter une catégorie
        </Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Aucune catégorie pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ordre</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Produits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">
                      {c.ordre}
                    </TableCell>
                    <TableCell className="font-medium">{c.libelle}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {c.slug}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {c._count?.produits ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditCat(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <CategorieFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categorie={editCat}
        onSaved={load}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer cette catégorie ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?._count?.produits ?? 0 > 0
                ? `Impossible : ${deleteTarget?._count?.produits ?? 0} produit(s) utilisent cette catégorie. Réassignez-les d'abord.`
                : `Cette action est irréversible. La catégorie « ${deleteTarget?.libelle} » sera définitivement supprimée.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {(deleteTarget?._count?.produits ?? 0) === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ============================================================
   Categorie form dialog
============================================================ */
function CategorieFormDialog({
  open,
  onOpenChange,
  categorie,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categorie: CategorieAvecCount | null;
  onSaved: () => void;
}) {
  const [libelle, setLibelle] = useState("");
  const [slug, setSlug] = useState("");
  const [ordre, setOrdre] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categorie) {
      setLibelle(categorie.libelle);
      setSlug(categorie.slug);
      setOrdre(String(categorie.ordre));
    } else {
      setLibelle("");
      setSlug("");
      setOrdre("");
    }
  }, [categorie, open]);

  async function save() {
    if (!libelle || !slug) {
      toast.error("Le libellé et le slug sont requis");
      return;
    }
    setSaving(true);
    try {
      const body = {
        libelle,
        slug,
        ordre: ordre ? Number(ordre) : undefined,
      };
      if (categorie) {
        await adminApi(`/api/categories/${categorie.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Catégorie mise à jour");
      } else {
        await adminApi("/api/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Catégorie créée");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {categorie ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Libellé *</Label>
            <Input
              value={libelle}
              onChange={(e) => {
                setLibelle(e.target.value);
                if (!categorie) setSlug(slugify(e.target.value));
              }}
              placeholder="Ex : Caftans, Takchitas..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="caftans, takchitas..."
            />
            <p className="text-xs text-muted-foreground">
              Utilisé dans l'URL et les filtres
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Ordre d'affichage</Label>
            <Input
              type="number"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
              placeholder="1, 2, 3..."
            />
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
