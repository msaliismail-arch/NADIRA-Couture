"use client";

/**
 * NADIRA Couture — Admin · Commandes section.
 * Includes CommandeDetailDialog and ManualOrderDialog (exported because
 * the Dashboard section also uses them).
 */

import { useCallback, useEffect, useState } from "react";
import type { Commande, Client, Produit } from "@/lib/types";
import { formatMAD, formatDate } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// lucide
import {
  Plus,
  Eye,
  Phone,
  Clock,
  Check,
  X,
  Search,
  Users,
  Package,
  Ruler,
  Save,
} from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import {
  adminApi,
  STATUT_LABELS,
  StatutBadge,
  ProduitThumb,
} from "./admin-shared";

/* ============================================================
   Commandes section
============================================================ */

export function CommandesSection() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [detailCmd, setDetailCmd] = useState<Commande | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openManual, setOpenManual] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<Commande[]>("/api/commandes")
      .then(setCommandes)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = commandes.filter(
    (c) => filterStatut === "tous" || c.statut === filterStatut
  );
  const enAttenteCount = commandes.filter(
    (c) => c.statut === "en_attente"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-emerald-deep">
            Commandes
          </h1>
          <p className="text-sm text-muted-foreground">
            {commandes.length} commande{commandes.length > 1 ? "s" : ""}
            {enAttenteCount > 0 && (
              <span className="text-destructive font-medium">
                {" "}
                · {enAttenteCount} nouvelle
                {enAttenteCount > 1 ? "s" : ""} demande
                {enAttenteCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          onClick={() => setOpenManual(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter une commande
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["tous", "en_attente", "en_confection", "expediee", "livree", "annulee"].map(
          (s) => {
            const count =
              s === "tous"
                ? commandes.length
                : commandes.filter((c) => c.statut === s).length;
            const active = filterStatut === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-emerald text-ivory border-emerald"
                    : "bg-card text-foreground border-border hover:border-emerald/40"
                }`}
              >
                {s === "tous" ? "Tous" : STATUT_LABELS[s]}
                {count > 0 && <span className="opacity-70 ml-1">({count})</span>}
                {s === "en_attente" && count > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] bg-destructive text-white rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          }
        )}
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucune commande
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {c.reference}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {c.client
                            ? `${c.client.prenom} ${c.client.nom}`
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {c.client?.telephone || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(c.dateCommande)}
                    </TableCell>
                    <TableCell>
                      <StatutBadge statut={c.statut} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMAD(c.montantTotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDetailCmd(c);
                          setOpenDetail(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {openDetail && detailCmd && (
        <CommandeDetailDialog
          id={detailCmd.id}
          open={openDetail}
          onOpenChange={(o) => {
            setOpenDetail(o);
            if (!o) load();
          }}
        />
      )}

      <ManualOrderDialog
        open={openManual}
        onOpenChange={(o) => {
          setOpenManual(o);
          if (!o) load();
        }}
      />
    </div>
  );
}

/* ============================================================
   Commande detail dialog
============================================================ */

export function CommandeDetailDialog({
  id,
  open,
  onOpenChange,
}: {
  id: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [cmd, setCmd] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState("");
  const [notes, setNotes] = useState("");
  const [dateRetrait, setDateRetrait] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<Commande>(`/api/commandes/${id}`)
      .then((c) => {
        setCmd(c);
        setStatut(c.statut);
        setNotes(c.notes || "");
        setDateRetrait(
          c.dateRetrait
            ? new Date(c.dateRetrait).toISOString().slice(0, 10)
            : ""
        );
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function saveStatut() {
    if (!cmd) return;
    setSaving(true);
    try {
      await adminApi(`/api/commandes/${cmd.id}`, {
        method: "PUT",
        body: JSON.stringify({
          statut,
          notes,
          dateRetrait: dateRetrait || null,
        }),
      });
      toast.success("Commande mise à jour");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            Commande {cmd?.reference}
            {cmd && <StatutBadge statut={cmd.statut} />}
          </DialogTitle>
        </DialogHeader>
        {loading || !cmd ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
                  Client
                </p>
                <p className="font-medium">
                  {cmd.client?.prenom} {cmd.client?.nom}
                </p>
                {cmd.client?.telephone && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {cmd.client.telephone}
                  </p>
                )}
                {cmd.client?.email && (
                  <p className="text-muted-foreground">{cmd.client.email}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
                  Détails
                </p>
                <p className="text-muted-foreground">
                  Date : {formatDate(cmd.dateCommande)}
                </p>
                {cmd.dateRetrait && (
                  <p className="text-muted-foreground">
                    Retrait : {formatDate(cmd.dateRetrait)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
                Articles
              </p>
              <div className="border border-border rounded-md divide-y divide-border">
                {cmd.lignes?.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <ProduitThumb
                      photos={l.produit?.photos || ""}
                      alt={l.produit?.nom || ""}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {l.produit?.nom || `Produit #${l.idProduit}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.quantite} × {formatMAD(l.prixUnitaire)}
                        {l.surMesure && (
                          <span className="ml-2 text-gold-deep">
                            · sur-mesure
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-medium text-sm">
                      {formatMAD(l.prixUnitaire * l.quantite)}
                    </span>
                  </div>
                ))}
                {(!cmd.lignes || cmd.lignes.length === 0) && (
                  <p className="p-3 text-sm text-muted-foreground">
                    Aucun article
                  </p>
                )}
              </div>
            </div>

            <div className="bg-muted/40 rounded-md p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Total de la commande
              </p>
              <p className="font-display text-2xl text-emerald-deep">
                {formatMAD(cmd.montantTotal)}
              </p>
            </div>

            {cmd.notes && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
                  Notes
                </p>
                <p className="text-sm bg-muted/40 p-3 rounded-md whitespace-pre-wrap">
                  {cmd.notes}
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-display text-base text-emerald-deep">
                Mettre à jour la commande
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Statut</Label>
                  <Select value={statut} onValueChange={setStatut}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUT_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date de retrait</Label>
                  <Input
                    type="date"
                    value={dateRetrait}
                    onChange={(e) => setDateRetrait(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes internes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                onClick={saveStatut}
                disabled={saving}
                className="bg-emerald hover:bg-emerald-deep text-ivory"
              >
                <Save className="w-4 h-4 mr-1" />{" "}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   Manual order dialog
============================================================ */

type LigneForm = {
  produit: Produit;
  quantite: number;
  prixUnitaire: number;
  surMesure: boolean;
  taille: string;
  couleur: string;
};

export function ManualOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  // Client search state
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClient, setNewClient] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
  });

  // Produits lignes
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Mesures
  const [withMesures, setWithMesures] = useState(false);
  const [mesures, setMesures] = useState<Record<string, string>>({
    tourPoitrine: "",
    tourTaille: "",
    tourHanches: "",
    longueurRobe: "",
    longueurManche: "",
    longueurEpaule: "",
    tourBras: "",
    notes: "",
  });

  // Logistique
  const [dateRetrait, setDateRetrait] = useState("");
  const [statut, setStatut] = useState("en_attente");

  // Confirmation
  const [confirme, setConfirme] = useState(false);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    adminApi<Client[]>("/api/clients").then(setClients).catch(() => {});
    adminApi<Produit[]>("/api/produits").then(setProduits).catch(() => {});
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (open) return;
    setClientSearch("");
    setSelectedClient(null);
    setNewClientMode(false);
    setNewClient({ nom: "", prenom: "", telephone: "", email: "" });
    setLignes([]);
    setProductSearch("");
    setWithMesures(false);
    setMesures({
      tourPoitrine: "",
      tourTaille: "",
      tourHanches: "",
      longueurRobe: "",
      longueurManche: "",
      longueurEpaule: "",
      tourBras: "",
      notes: "",
    });
    setDateRetrait("");
    setStatut("en_attente");
    setConfirme(false);
    setNotes("");
  }, [open]);

  const filteredClients = clientSearch
    ? clients
        .filter((c) => {
          const q = clientSearch.toLowerCase();
          return (
            c.telephone.includes(clientSearch) ||
            c.nom.toLowerCase().includes(q) ||
            c.prenom.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  const filteredProducts = productSearch
    ? produits
        .filter((p) => {
          const q = productSearch.toLowerCase();
          return (
            p.nom.toLowerCase().includes(q) ||
            (p.categorie?.libelle || "").toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  const montantTotal = lignes.reduce(
    (s, l) => s + l.prixUnitaire * l.quantite,
    0
  );

  function addLigne(p: Produit) {
    setLignes((l) => [
      ...l,
      {
        produit: p,
        quantite: 1,
        prixUnitaire: p.prix,
        surMesure: false,
        taille: "",
        couleur: "",
      },
    ]);
    setProductSearch("");
  }

  function updateLigne(
    i: number,
    patch: Partial<LigneForm>
  ) {
    setLignes((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function removeLigne(i: number) {
    setLignes((l) => l.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!selectedClient && !newClientMode) {
      toast.error("Sélectionnez ou créez un client");
      return;
    }
    if (
      newClientMode &&
      (!newClient.nom || !newClient.prenom || !newClient.telephone)
    ) {
      toast.error("Renseignez nom, prénom et téléphone du nouveau client");
      return;
    }
    if (lignes.length === 0) {
      toast.error("Ajoutez au moins un article");
      return;
    }
    if (!confirme) {
      toast.error("Confirmez que le client a été contacté par téléphone");
      return;
    }
    setSaving(true);
    const mesuresPayload: Record<string, number | string | undefined> = {};
    if (withMesures) {
      for (const k of [
        "tourPoitrine",
        "tourTaille",
        "tourHanches",
        "longueurRobe",
        "longueurManche",
        "longueurEpaule",
        "tourBras",
      ]) {
        const v = mesures[k];
        if (v) mesuresPayload[k] = Number(v);
      }
      if (mesures.notes) mesuresPayload.notes = mesures.notes;
    }
    const body: Record<string, unknown> = {
      lignes: lignes.map((l) => ({
        idProduit: l.produit.id,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        surMesure: l.surMesure,
        taille: l.taille || null,
        couleur: l.couleur || null,
      })),
      dateRetrait: dateRetrait || undefined,
      statut,
      notes: notes || undefined,
    };
    if (selectedClient && !newClientMode) {
      body.idClient = selectedClient.id;
    } else if (newClientMode) {
      body.newClient = newClient;
    }
    if (withMesures) {
      body.mesures = mesuresPayload;
    }
    try {
      const res = await adminApi<{ reference: string }>(
        "/api/commandes/manuelle",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      toast.success(`Commande ${res.reference} créée`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const mesureFields: [string, string][] = [
    ["tourPoitrine", "Tour poitrine"],
    ["tourTaille", "Tour taille"],
    ["tourHanches", "Tour hanches"],
    ["longueurRobe", "Longueur robe"],
    ["longueurManche", "Longueur manche"],
    ["longueurEpaule", "Longueur épaule"],
    ["tourBras", "Tour bras"],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle commande manuelle</DialogTitle>
          <DialogDescription>
            Créer une commande pour un client (atelier ou téléphone)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Bloc Client */}
          <section className="space-y-2">
            <h4 className="font-display text-base text-emerald-deep flex items-center gap-2">
              <Users className="w-4 h-4" /> Client
            </h4>
            {!newClientMode && !selectedClient && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Rechercher par téléphone, nom..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
                {filteredClients.length > 0 && (
                  <ul className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                    {filteredClients.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                        >
                          <span className="font-medium">
                            {c.prenom} {c.nom}
                          </span>
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3 inline" />
                            {c.telephone}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewClientMode(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Nouveau client
                </Button>
              </>
            )}
            {selectedClient && !newClientMode && (
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                <div>
                  <p className="font-medium text-sm">
                    {selectedClient.prenom} {selectedClient.nom}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedClient.telephone}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClient(null)}
                >
                  Changer
                </Button>
              </div>
            )}
            {newClientMode && (
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-md">
                <Input
                  placeholder="Prénom *"
                  value={newClient.prenom}
                  onChange={(e) =>
                    setNewClient({ ...newClient, prenom: e.target.value })
                  }
                />
                <Input
                  placeholder="Nom *"
                  value={newClient.nom}
                  onChange={(e) =>
                    setNewClient({ ...newClient, nom: e.target.value })
                  }
                />
                <Input
                  placeholder="Téléphone *"
                  value={newClient.telephone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, telephone: e.target.value })
                  }
                />
                <Input
                  placeholder="Email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-2"
                  onClick={() => setNewClientMode(false)}
                >
                  Annuler — utiliser un client existant
                </Button>
              </div>
            )}
          </section>

          <Separator />

          {/* Bloc Produits */}
          <section className="space-y-2">
            <h4 className="font-display text-base text-emerald-deep flex items-center gap-2">
              <Package className="w-4 h-4" /> Articles
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher un produit à ajouter..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            {filteredProducts.length > 0 && (
              <ul className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => addLigne(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
                    >
                      <ProduitThumb photos={p.photos} alt={p.nom} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.categorie?.libelle}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-emerald-deep">
                        {formatMAD(p.prix)}
                      </span>
                      <Plus className="w-4 h-4 text-emerald" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {lignes.length > 0 && (
              <div className="border border-border rounded-md divide-y divide-border">
                {lignes.map((l, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <ProduitThumb
                      photos={l.produit.photos}
                      alt={l.produit.nom}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {l.produit.nom}
                      </p>
                      <label className="text-xs flex items-center gap-2 mt-1 text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={l.surMesure}
                          onChange={(e) =>
                            updateLigne(i, { surMesure: e.target.checked })
                          }
                          className="w-3.5 h-3.5 accent-emerald"
                        />
                        Sur-mesure
                      </label>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="text-xs">Qté</Label>
                      <Input
                        type="number"
                        min="1"
                        className="w-16 h-8"
                        value={l.quantite}
                        onChange={(e) =>
                          updateLigne(i, {
                            quantite: Number(e.target.value) || 1,
                          })
                        }
                      />
                      <Label className="text-xs">Prix</Label>
                      <Input
                        type="number"
                        className="w-24 h-8"
                        value={l.prixUnitaire}
                        onChange={(e) =>
                          updateLigne(i, {
                            prixUnitaire: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 w-8 p-0"
                        onClick={() => removeLigne(i)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-3 flex justify-between items-center bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    Total commande
                  </span>
                  <span className="font-display text-lg text-emerald-deep">
                    {formatMAD(montantTotal)}
                  </span>
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Bloc Mesures */}
          <section className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={withMesures}
                onChange={(e) => setWithMesures(e.target.checked)}
                className="w-4 h-4 accent-emerald"
              />
              <Ruler className="w-4 h-4 text-emerald" /> Inclure des mesures
              sur-mesure
            </label>
            {withMesures && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted/30 p-3 rounded-md">
                {mesureFields.map(([k, l]) => (
                  <div key={k} className="space-y-1">
                    <Label className="text-xs">{l}</Label>
                    <Input
                      type="number"
                      className="h-8"
                      value={mesures[k]}
                      onChange={(e) =>
                        setMesures({ ...mesures, [k]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 space-y-1">
                  <Label className="text-xs">Notes mesures</Label>
                  <Input
                    value={mesures.notes}
                    onChange={(e) =>
                      setMesures({ ...mesures, notes: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Bloc Logistique */}
          <section className="space-y-2">
            <h4 className="font-display text-base text-emerald-deep flex items-center gap-2">
              <Clock className="w-4 h-4" /> Logistique
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Date de retrait</Label>
                <Input
                  type="date"
                  value={dateRetrait}
                  onChange={(e) => setDateRetrait(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Statut initial</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUT_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Bloc Confirmation */}
          <section className="space-y-3">
            <h4 className="font-display text-base text-emerald-deep flex items-center gap-2">
              <Check className="w-4 h-4" /> Confirmation
            </h4>
            <div className="bg-muted/30 p-3 rounded-md flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total commande
              </span>
              <span className="font-display text-lg text-emerald-deep">
                {formatMAD(montantTotal)}
              </span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes internes</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={confirme}
                onChange={(e) => setConfirme(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald"
              />
              <span>Client contacté et confirmé par téléphone</span>
            </label>
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-emerald hover:bg-emerald-deep text-ivory"
          >
            {saving ? "Création..." : "Créer la commande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
