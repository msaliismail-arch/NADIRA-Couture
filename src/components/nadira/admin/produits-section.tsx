"use client";

/**
 * NADIRA Couture — Admin · Produits section.
 * Includes the create/edit ProduitFormDialog (private to this file).
 */

import { useCallback, useEffect, useState } from "react";
import type { Produit, Categorie } from "@/lib/types";
import { api, formatMAD } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// lucide
import { Plus, Edit, Trash2, Search, Upload, X, ImageIcon } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi, ProduitThumb, slugify } from "./admin-shared";

/* ============================================================
   Produits section
============================================================ */

export function ProduitsSection() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editProduit, setEditProduit] = useState<Produit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Produit | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi<Produit[]>("/api/produits"),
      api<Categorie[]>("/api/categories"),
    ])
      .then(([p, c]) => {
        setProduits(p);
        setCategories(c);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = produits.filter(
    (p) =>
      !search ||
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await adminApi(`/api/produits/${deleteTarget.slug}`, {
        method: "DELETE",
      });
      toast.success("Produit supprimé définitivement");
      setDeleteTarget(null);
      // Force a fresh fetch from the server to ensure no ghost/cached data
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-emerald-deep">Produits</h1>
          <p className="text-sm text-muted-foreground">
            {produits.length} produit{produits.length > 1 ? "s" : ""} en
            catalogue
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          onClick={() => {
            setEditProduit(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter un produit
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Photo</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Catégorie
                  </TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Vedette</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun produit
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <ProduitThumb photos={p.photos} alt={p.nom} />
                    </TableCell>
                    <TableCell className="font-medium">{p.nom}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {p.categorie?.libelle || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMAD(p.prix)}
                    </TableCell>
                    <TableCell className="text-right">{p.stock}</TableCell>
                    <TableCell>
                      {p.vedette && (
                        <Badge className="bg-gold/15 text-gold-deep border-gold/30">
                          Vedette
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditProduit(p);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(p)}
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

      <ProduitFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        produit={editProduit}
        categories={categories}
        onSaved={load}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit « {deleteTarget?.nom} »
              sera définitivement supprimé du catalogue.
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
   Produit form dialog
============================================================ */

function ProduitFormDialog({
  open,
  onOpenChange,
  produit,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  produit: Produit | null;
  categories: Categorie[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nom: "",
    slug: "",
    description: "",
    idCategorie: "",
    prix: "",
    tissu: "",
    couleurs: "",
    delaiRealisation: "21",
    occasion: "",
    vedette: false,
    stock: "1",
    photos: "",
    longueur: "",
    largeur: "",
    tourPoitrine: "",
    tourTaille: "",
    tourHanches: "",
    longueurManche: "",
    autreDimensions: "",
    datePiece: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  useEffect(() => {
    if (produit) {
      setForm({
        nom: produit.nom,
        slug: produit.slug,
        description: produit.description,
        idCategorie: String(produit.idCategorie),
        prix: String(produit.prix),
        tissu: produit.tissu,
        couleurs: produit.couleurs,
        delaiRealisation: String(produit.delaiRealisation),
        occasion: produit.occasion || "",
        vedette: produit.vedette,
        stock: String(produit.stock),
        photos: produit.photos,
        longueur: produit.longueur != null ? String(produit.longueur) : "",
        largeur: produit.largeur != null ? String(produit.largeur) : "",
        tourPoitrine:
          produit.tourPoitrine != null ? String(produit.tourPoitrine) : "",
        tourTaille:
          produit.tourTaille != null ? String(produit.tourTaille) : "",
        tourHanches:
          produit.tourHanches != null ? String(produit.tourHanches) : "",
        longueurManche:
          produit.longueurManche != null ? String(produit.longueurManche) : "",
        autreDimensions: produit.autreDimensions || "",
        datePiece: produit.datePiece
          ? String(produit.datePiece).slice(0, 10)
          : "",
      });
    } else {
      setForm({
        nom: "",
        slug: "",
        description: "",
        idCategorie: "",
        prix: "",
        tissu: "",
        couleurs: "",
        delaiRealisation: "21",
        occasion: "",
        vedette: false,
        stock: "1",
        photos: "",
        longueur: "",
        largeur: "",
        tourPoitrine: "",
        tourTaille: "",
        tourHanches: "",
        longueurManche: "",
        autreDimensions: "",
        datePiece: "",
      });
    }
  }, [produit, open]);

  async function save() {
    if (
      !form.nom ||
      !form.slug ||
      !form.description ||
      !form.idCategorie ||
      !form.prix ||
      !form.tissu ||
      !form.couleurs ||
      !form.photos
    ) {
      toast.error("Tous les champs requis doivent être remplis");
      return;
    }
    // If editing an existing product, ask for confirmation first
    if (produit && !editConfirmOpen) {
      setEditConfirmOpen(true);
      return;
    }
    setEditConfirmOpen(false);
    setSaving(true);
    const numOrNullOrUndef = (v: string): number | null => {
      if (v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const body = {
      nom: form.nom,
      slug: form.slug,
      description: form.description,
      idCategorie: Number(form.idCategorie),
      prix: Number(form.prix),
      tissu: form.tissu,
      couleurs: form.couleurs,
      delaiRealisation: Number(form.delaiRealisation) || 21,
      occasion: form.occasion || null,
      vedette: form.vedette,
      stock: Number(form.stock) || 0,
      photos: form.photos,
      longueur: numOrNullOrUndef(form.longueur),
      largeur: numOrNullOrUndef(form.largeur),
      tourPoitrine: numOrNullOrUndef(form.tourPoitrine),
      tourTaille: numOrNullOrUndef(form.tourTaille),
      tourHanches: numOrNullOrUndef(form.tourHanches),
      longueurManche: numOrNullOrUndef(form.longueurManche),
      autreDimensions: form.autreDimensions || null,
      datePiece: form.datePiece
        ? new Date(form.datePiece).toISOString()
        : null,
    };
    try {
      if (produit) {
        await adminApi(`/api/produits/${produit.slug}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Produit mis à jour");
      } else {
        await adminApi("/api/produits", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Produit créé");
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  // Upload image files to /api/upload and append URLs to form.photos
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("nadira-admin-token") : null;
    const newUrls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        // Validate type
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}" n'est pas une image`);
          continue;
        }
        // Validate size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" dépasse 10 Mo`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || `Échec upload de "${file.name}"`);
          continue;
        }
        const data = await res.json();
        newUrls.push(data.url);
      }
      if (newUrls.length > 0) {
        const existing = form.photos
          ? form.photos.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const combined = [...existing, ...newUrls].join(",");
        setForm({ ...form, photos: combined });
        toast.success(`${newUrls.length} image(s) ajoutée(s)`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  // Remove a single photo from the photos list by index
  function removePhoto(index: number) {
    const photos = form.photos
      ? form.photos.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    photos.splice(index, 1);
    setForm({ ...form, photos: photos.join(",") });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {produit ? "Modifier le produit" : "Nouveau produit"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Nom *</Label>
            <Input
              value={form.nom}
              onChange={(e) =>
                setForm({
                  ...form,
                  nom: e.target.value,
                  slug: produit ? form.slug : slugify(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug *</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie *</Label>
            <Select
              value={form.idCategorie}
              onValueChange={(v) => setForm({ ...form, idCategorie: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Prix (MAD) *</Label>
            <Input
              type="number"
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Stock</Label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tissu *</Label>
            <Input
              value={form.tissu}
              onChange={(e) => setForm({ ...form, tissu: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Couleurs *</Label>
            <Input
              value={form.couleurs}
              onChange={(e) => setForm({ ...form, couleurs: e.target.value })}
              placeholder="Émeraude, Or"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Délai (jours)</Label>
            <Input
              type="number"
              value={form.delaiRealisation}
              onChange={(e) =>
                setForm({ ...form, delaiRealisation: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Occasion</Label>
            <Input
              value={form.occasion}
              onChange={(e) =>
                setForm({ ...form, occasion: e.target.value })
              }
              placeholder="Mariage, Cérémonie"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Photos du produit *</Label>
            {/* Upload button — works on PC and mobile (camera + gallery) */}
            <div className="flex flex-wrap gap-3 items-center">
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gold/40 bg-gold/5 px-4 py-3 text-sm text-emerald-deep hover:bg-gold/10 hover:border-gold/60 transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Upload en cours..." : "Téléverser des images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFileUpload(e.target.files);
                    e.target.value = "";
                  }}
                  disabled={uploading}
                />
              </label>
              <span className="text-xs text-muted-foreground">
                Depuis votre appareil (galerie ou appareil photo)
              </span>
            </div>
            {/* Preview thumbnails */}
            {form.photos && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.photos
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((url, i) => (
                    <div
                      key={url}
                      className="relative w-20 h-20 rounded-md overflow-hidden border border-border group bg-muted"
                    >
                      <PhotoPreview key={url} url={url} index={i} />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label="Supprimer cette photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-emerald-deep/80 text-ivory text-[8px] text-center py-0.5 z-10">
                          Couverture
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
            {!form.photos && (
              <p className="text-xs text-muted-foreground mt-1">
                Aucune photo pour l'instant. Cliquez sur « Téléverser des images » pour ajouter des photos depuis votre appareil.
              </p>
            )}
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Switch
              checked={form.vedette}
              onCheckedChange={(v) => setForm({ ...form, vedette: v })}
              id="vedette"
            />
            <Label htmlFor="vedette">
              Mettre en vedette (affichage page d&apos;accueil)
            </Label>
          </div>

          {/* Dimensions */}
          <div className="md:col-span-2 mt-2">
            <p className="text-xs uppercase tracking-[0.15em] text-emerald-deep font-medium mb-2">
              Dimensions (cm)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-md">
              <div className="space-y-1">
                <Label className="text-xs">Longueur</Label>
                <Input
                  type="number"
                  value={form.longueur}
                  onChange={(e) =>
                    setForm({ ...form, longueur: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Largeur</Label>
                <Input
                  type="number"
                  value={form.largeur}
                  onChange={(e) =>
                    setForm({ ...form, largeur: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tour de poitrine</Label>
                <Input
                  type="number"
                  value={form.tourPoitrine}
                  onChange={(e) =>
                    setForm({ ...form, tourPoitrine: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tour de taille</Label>
                <Input
                  type="number"
                  value={form.tourTaille}
                  onChange={(e) =>
                    setForm({ ...form, tourTaille: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tour de hanches</Label>
                <Input
                  type="number"
                  value={form.tourHanches}
                  onChange={(e) =>
                    setForm({ ...form, tourHanches: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Longueur manche</Label>
                <Input
                  type="number"
                  value={form.longueurManche}
                  onChange={(e) =>
                    setForm({ ...form, longueurManche: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1 col-span-2 md:col-span-3">
                <Label className="text-xs">Autres dimensions</Label>
                <Textarea
                  rows={2}
                  value={form.autreDimensions}
                  onChange={(e) =>
                    setForm({ ...form, autreDimensions: e.target.value })
                  }
                  placeholder="Détails complémentaires (tour de cou, hauteur totale, etc.)"
                />
              </div>
            </div>
          </div>

          {/* Date de l'annonce/pièce */}
          <div className="space-y-1.5">
            <Label>Date de l&apos;annonce / pièce</Label>
            <Input
              type="date"
              value={form.datePiece}
              onChange={(e) =>
                setForm({ ...form, datePiece: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={save}
            disabled={saving || uploading}
            className="bg-emerald hover:bg-emerald-deep text-ivory"
          >
            {saving
              ? "Enregistrement..."
              : uploading
              ? "Upload..."
              : produit
              ? "Enregistrer les modifications"
              : "Créer le produit"}
          </Button>
        </DialogFooter>

        {/* Edit confirmation dialog */}
        <AlertDialog
          open={editConfirmOpen}
          onOpenChange={setEditConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirmer la modification ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Vous êtes sur le point de modifier le produit
                « {produit?.nom} ». Cette action remplacera les informations
                actuelles. Voulez-vous continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={save}
                className="bg-emerald hover:bg-emerald-deep text-ivory"
              >
                Oui, enregistrer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   PhotoPreview — handles loading, error, and loaded states
   for a single product photo thumbnail.
   Includes a retry mechanism and URL rewriting for old upload paths.
============================================================ */
function PhotoPreview({ url, index }: { url: string; index: number }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [retries, setRetries] = useState(0);

  // Rewrite old-style /uploads/xxx.jpg to /api/uploads/xxx.jpg
  // so the image is served through the reliable API route.
  const displayUrl = url.startsWith("/uploads/")
    ? `/api/uploads/${url.slice("/uploads/".length)}`
    : url;

  // Retry up to 2 times with a short delay (handles timing issues
  // where the file might not be fully flushed to disk yet)
  useEffect(() => {
    if (status === "error" && retries < 2) {
      const timer = setTimeout(() => {
        setRetries((r) => r + 1);
        setStatus("loading");
      }, 500 * (retries + 1));
      return () => clearTimeout(timer);
    }
  }, [status, retries]);

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground p-1">
          <ImageIcon className="w-5 h-5 mb-1" />
          <span className="text-[7px] text-center leading-tight">Erreur</span>
        </div>
      )}
      <img
        key={`${displayUrl}-${retries}`}
        src={displayUrl}
        alt={`Photo ${index + 1}`}
        className={`w-full h-full object-cover transition-opacity duration-200 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  );
}
