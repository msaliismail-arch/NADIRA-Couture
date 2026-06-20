"use client";

/**
 * NADIRA Couture — Back-office (Espace Administrateur)
 * Light, efficient Shopify/Net-a-Porter style admin on ivory-warm background
 * with emerald + gold accents. NOT the velvet dark theme (that's the public site).
 */

import { useCallback, useEffect, useState } from "react";
import { useStore, type AdminSection } from "@/lib/store";
import { api, formatMAD, formatDate, formatDateTime } from "@/lib/api";
import type {
  Produit,
  Categorie,
  Commande,
  Client,
  RendezVous,
  Avis,
  Artisan,
  Contenu,
  Mesure,
  Galerie,
} from "@/lib/types";
import { STATUT_LABELS, STATUT_COLORS } from "@/lib/types";
import {
  NadiraWordmark,
  NadiraMedallion,
} from "@/components/nadira/brand";

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// lucide
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Ruler,
  Star,
  FileText,
  Users,
  Images,
  Upload,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Eye,
  Phone,
  Clock,
  AlertCircle,
  Menu,
  Save,
  Lock,
} from "lucide-react";

// recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// sonner
import { toast } from "sonner";

/* ============================================================
   Helpers
============================================================ */

const TOKEN_KEY = "nadira-admin-token";
const NAME_KEY = "nadira-admin-nom";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getAdminName(): string {
  if (typeof window === "undefined") return "Administrateur";
  return localStorage.getItem(NAME_KEY) || "Administrateur";
}

async function adminApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      try {
        msg = (await res.text()) || msg;
      } catch {
        /* noop */
      }
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const NAV_ITEMS: {
  key: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "produits", label: "Produits", icon: Package },
  { key: "commandes", label: "Commandes", icon: ShoppingCart },
  { key: "rendezvous", label: "Rendez-vous", icon: Calendar },
  { key: "mesures", label: "Mesures", icon: Ruler },
  { key: "avis", label: "Avis", icon: Star },
  { key: "galerie", label: "Galerie", icon: Images },
  { key: "artisans", label: "Artisans", icon: Users },
  { key: "contenu", label: "Contenu", icon: FileText },
];

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${
        STATUT_COLORS[statut] ||
        "bg-muted text-muted-foreground border-border"
      }`}
    >
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

function ProduitThumb({ photos, alt }: { photos: string; alt: string }) {
  const first = photos?.split(",")[0]?.trim();
  return (
    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted border border-border shrink-0">
      {first ? (
        <img
          src={first}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Package className="w-4 h-4 m-auto mt-3 text-muted-foreground" />
      )}
    </div>
  );
}

/* ============================================================
   Main export
============================================================ */

export function AdminView() {
  const { adminAuthed, setAdminAuthed } = useStore();
  // Lazy initial state: if no token in localStorage, skip boot entirely
  const [booted, setBooted] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(TOKEN_KEY);
  });

  // Verify the existing token (if any) with the backend
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminApi<{ admin: { id: number; nom: string } }>("/api/admin/me")
      .then(() => setAdminAuthed(true))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(NAME_KEY);
        setAdminAuthed(false);
      })
      .finally(() => setBooted(true));
  }, [setAdminAuthed]);

  if (!booted) {
    return (
      <div className="velvet-deep min-h-screen flex items-center justify-center">
        <NadiraMedallion className="w-16 h-16 opacity-60" />
      </div>
    );
  }

  if (!adminAuthed) return <AdminLogin />;
  return <AdminDashboard />;
}

/* ============================================================
   Login screen
============================================================ */

function AdminLogin() {
  const { setAdminAuthed, setView } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{
        token: string;
        admin: { id: number; nom: string; email: string; role: string };
      }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(NAME_KEY, data.admin.nom);
      setAdminAuthed(true);
      toast.success(`Bienvenue, ${data.admin.nom}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="velvet-deep min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setView("accueil")}
          className="text-ivory/60 hover:text-gold-light text-xs tracking-[0.2em] uppercase mb-6 mx-auto block transition-colors"
        >
          ← Retour au site
        </button>

        <div className="bg-card rounded-2xl shadow-2xl border border-gold/30 p-8">
          <div className="flex justify-center mb-5">
            <NadiraMedallion className="w-20 h-20" />
          </div>
          <h1 className="font-display text-2xl text-center text-emerald-deep mb-1">
            Espace Administrateur
          </h1>
          <p className="text-center text-[10px] text-muted-foreground tracking-[0.34em] uppercase mb-6">
            Maison NADIRA Couture
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@nadira-couture.ma"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-wider"
              >
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={twoFA}
                onChange={(e) => setTwoFA(e.target.checked)}
                className="rounded border-border w-4 h-4 accent-emerald"
              />
              Activer la double authentification
            </label>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald hover:bg-emerald-deep text-ivory h-10"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground mt-6 tracking-[0.2em] uppercase">
            Accès réservé à la maison NADIRA
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard shell (top bar + sidebar + main)
============================================================ */

function AdminDashboard() {
  const { setAdminAuthed, adminSection, setView } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const adminName = getAdminName();

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    setAdminAuthed(false);
    toast.success("Déconnecté");
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-warm">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <NadiraWordmark className="scale-90 origin-left" />
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-emerald-deep bg-emerald/5 border border-emerald/20 rounded-full px-2.5 py-1">
              <Lock className="w-3 h-3" /> Session sécurisée
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("accueil")}
              className="text-emerald-deep"
            >
              Voir le site
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {adminName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-64 bg-card border-r border-border shrink-0">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 max-h-screen overflow-y-auto nadira-scroll">
          {adminSection === "dashboard" && <DashboardSection />}
          {adminSection === "produits" && <ProduitsSection />}
          {adminSection === "commandes" && <CommandesSection />}
          {adminSection === "rendezvous" && <RendezvousSection />}
          {adminSection === "mesures" && <MesuresSection />}
          {adminSection === "avis" && <AvisSection />}
          {adminSection === "galerie" && <GalerieSection />}
          {adminSection === "artisans" && <ArtisansSection />}
          {adminSection === "contenu" && <ContenuSection />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { adminSection, setAdminSection } = useStore();
  return (
    <nav className="p-4 space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
        Navigation
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = adminSection === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              setAdminSection(item.key);
              onNavigate?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-emerald text-ivory shadow-sm"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
      <div className="pt-6 px-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Maison NADIRA
        </div>
        <div className="h-px gold-line opacity-60" />
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Atelier de Fès · Maroc
          <br />
          Couture haute joaillerie
        </p>
      </div>
    </nav>
  );
}

/* ============================================================
   1. Dashboard section
============================================================ */

type Stats = {
  totalCommandes: number;
  commandesEnAttente: number;
  commandesEnConfection: number;
  commandesLivrees: number;
  totalClients: number;
  totalProduits: number;
  rdvAVenir: number;
  topProduits: {
    produit: {
      id: number;
      nom: string;
      slug: string;
      photos: string;
      prix: number;
    };
    count: number;
  }[];
  commandesParMois: { mois: string; count: number }[];
  commandesRecentes: Commande[];
};

function DashboardSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCmd, setSelectedCmd] = useState<Commande | null>(null);
  const [openCmd, setOpenCmd] = useState(false);
  const [openManual, setOpenManual] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<Stats>("/api/stats")
      .then(setStats)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-emerald-deep">
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue d&apos;ensemble de l&apos;activité
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-deep text-ivory"
          onClick={() => setOpenManual(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Nouvelle commande
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={ShoppingCart}
          label="Commandes totales"
          value={stats.totalCommandes}
          accent="emerald"
        />
        <KpiCard
          icon={Users}
          label="Clients"
          value={stats.totalClients}
          accent="gold"
        />
        <KpiCard
          icon={Clock}
          label="En attente"
          value={stats.commandesEnAttente}
          badge
        />
        <KpiCard
          icon={Calendar}
          label="RDV à venir"
          value={stats.rdvAVenir}
          accent="emerald"
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <MiniStat label="En confection" value={stats.commandesEnConfection} />
        <MiniStat label="Livrées" value={stats.commandesLivrees} />
        <MiniStat label="Produits" value={stats.totalProduits} />
        <MiniStat label="RDV à venir" value={stats.rdvAVenir} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-display text-lg text-emerald-deep mb-1">
            Commandes · 6 derniers mois
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Évolution mensuelle des commandes
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.commandesParMois}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2D8C4" />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 11, fill: "#6B5F4D" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B5F4D" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#FBF7EE",
                  border: "1px solid #E2D8C4",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="count"
                name="Commandes"
                fill="#C9A24B"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg text-emerald-deep mb-1">
            Top produits
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Meilleures ventes</p>
          {stats.topProduits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucune vente enregistrée
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.topProduits.map((tp, i) => (
                <li key={tp.produit.id} className="flex items-center gap-3">
                  <span className="font-display text-gold-deep text-lg w-6 text-center">
                    {i + 1}
                  </span>
                  <ProduitThumb
                    photos={tp.produit.photos}
                    alt={tp.produit.nom}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tp.produit.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tp.count} vendu{tp.count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatMAD(tp.produit.prix)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg text-emerald-deep">
              Commandes récentes
            </h3>
            <p className="text-xs text-muted-foreground">5 dernières</p>
          </div>
        </div>
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
              {stats.commandesRecentes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucune commande
                  </TableCell>
                </TableRow>
              )}
              {stats.commandesRecentes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">
                    {c.reference}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.client
                      ? `${c.client.prenom} ${c.client.nom}`
                      : "—"}
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
                        setSelectedCmd(c);
                        setOpenCmd(true);
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
      </Card>

      {openCmd && selectedCmd && (
        <CommandeDetailDialog
          id={selectedCmd.id}
          open={openCmd}
          onOpenChange={setOpenCmd}
        />
      )}

      <ManualOrderDialog
        open={openManual}
        onOpenChange={setOpenManual}
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent = "emerald",
  badge,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: string | number;
  accent?: "emerald" | "gold";
  badge?: boolean;
}) {
  const accentBg =
    accent === "gold"
      ? "bg-gold/10 text-gold-deep"
      : "bg-emerald/10 text-emerald";
  return (
    <Card className="p-4 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentBg}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
          {label}
        </p>
        <p className="font-display text-2xl text-emerald-deep truncate flex items-center gap-2">
          {value}
          {badge && Number(value) > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] bg-destructive text-white rounded-full">
              {value}
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <span className="font-medium text-emerald-deep">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

/* ============================================================
   2. Produits section
============================================================ */

function ProduitsSection() {
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
      toast.success("Produit supprimé");
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
            <Label>Photos (URLs séparées par virgules) *</Label>
            <Input
              value={form.photos}
              onChange={(e) => setForm({ ...form, photos: e.target.value })}
              placeholder="/images/caftan-1.jpg,/images/caftan-2.jpg"
            />
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

/* ============================================================
   3. Commandes section
============================================================ */

function CommandesSection() {
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

function CommandeDetailDialog({
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

type LigneForm = {
  produit: Produit;
  quantite: number;
  prixUnitaire: number;
  surMesure: boolean;
  taille: string;
  couleur: string;
};

function ManualOrderDialog({
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

/* ============================================================
   4. Rendez-vous section
============================================================ */

const RDV_LABELS: Record<string, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  refuse: "Refusé",
  annule: "Annulé",
};
const RDV_COLORS: Record<string, string> = {
  planifie: "bg-amber-100 text-amber-800 border-amber-300",
  confirme: "bg-emerald-100 text-emerald-800 border-emerald-300",
  refuse: "bg-rose-100 text-rose-800 border-rose-300",
  annule: "bg-muted text-muted-foreground border-border",
};

function RendezvousSection() {
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<RendezVous[]>("/api/rendezvous")
      .then(setRdvs)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function updateStatut(id: number, statut: string) {
    try {
      await adminApi(`/api/rendezvous/${id}`, {
        method: "PUT",
        body: JSON.stringify({ statut }),
      });
      toast.success(
        statut === "confirme" ? "RDV confirmé" : "RDV refusé"
      );
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-emerald-deep">
          Rendez-vous
        </h1>
        <p className="text-sm text-muted-foreground">
          {rdvs.length} rendez-vous
        </p>
      </div>
      <Card className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead>Date & heure</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rdvs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun rendez-vous
                    </TableCell>
                  </TableRow>
                )}
                {rdvs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nom}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {r.telephone}
                      </div>
                      {r.email && (
                        <div className="text-xs text-muted-foreground">
                          {r.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(r.dateRdv)}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {r.type}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${RDV_COLORS[r.statut]}`}
                      >
                        {RDV_LABELS[r.statut] || r.statut}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.statut === "planifie" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatut(r.id, "confirme")}
                            className="text-emerald border-emerald/30 hover:bg-emerald/5"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatut(r.id, "refuse")}
                            className="text-destructive border-destructive/30 hover:bg-destructive/5"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Refuser
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
   5. Mesures section
============================================================ */

type MesureWithClient = Mesure & { client?: Client };

function MesuresSection() {
  const [mesures, setMesures] = useState<MesureWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MesureWithClient | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi<MesureWithClient[]>("/api/mesures")
      .then(setMesures)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const fields: [keyof Mesure, string][] = [
    ["tourPoitrine", "Poitrine"],
    ["tourTaille", "Taille"],
    ["tourHanches", "Hanches"],
    ["longueurRobe", "L. robe"],
    ["longueurManche", "L. manche"],
    ["longueurEpaule", "L. épaule"],
    ["tourBras", "Bras"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-emerald-deep">Mesures</h1>
        <p className="text-sm text-muted-foreground">
          {mesures.length} fiche{mesures.length > 1 ? "s" : ""} de mesures
        </p>
      </div>
      <Card className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Téléphone
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  {fields.map(([k, l]) => (
                    <TableHead
                      key={k as string}
                      className="text-right hidden xl:table-cell"
                    >
                      {l}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mesures.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucune mesure
                    </TableCell>
                  </TableRow>
                )}
                {mesures.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.client
                        ? `${m.client.prenom} ${m.client.nom}`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {m.client?.telephone || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(m.created_at)}
                    </TableCell>
                    {fields.map(([k]) => (
                      <TableCell
                        key={k as string}
                        className="text-right hidden xl:table-cell text-sm"
                      >
                        {(m[k] as number) ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(m)}
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

      <Dialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Fiche de mesures —{" "}
              {selected?.client
                ? `${selected.client.prenom} ${selected.client.nom}`
                : "Client"}
            </DialogTitle>
            <DialogDescription>
              {selected ? formatDateTime(selected.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3">
              {fields.map(([k, l]) => (
                <div key={k as string} className="bg-muted/40 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="font-display text-lg text-emerald-deep">
                    {(selected[k] as number) ?? "—"} cm
                  </p>
                </div>
              ))}
              {selected.notes && (
                <div className="col-span-2 bg-muted/40 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================
   6. Avis section
============================================================ */

function AvisSection() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  const load = useCallback(() => {
    setLoading(true);
    adminApi<Avis[]>("/api/avis")
      .then(setAvis)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pending = avis.filter((a) => !a.approuve);
  const approved = avis.filter((a) => a.approuve);
  const list = tab === "pending" ? pending : approved;

  async function toggleApprove(a: Avis, val: boolean) {
    try {
      await adminApi("/api/avis", {
        method: "PUT",
        body: JSON.stringify({ id: a.id, approuve: val }),
      });
      toast.success(val ? "Avis approuvé" : "Avis masqué");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function remove(id: number) {
    try {
      await adminApi(`/api/avis/${id}`, { method: "DELETE" });
      toast.success("Avis supprimé");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-emerald-deep">
          Avis clients
        </h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} en attente · {approved.length} publié
          {approved.length > 1 ? "s" : ""}
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "pending" | "approved")}
      >
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            En attente
            {pending.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs bg-destructive text-white rounded-full">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approuvés</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Aucun avis dans cette catégorie
            </Card>
          ) : (
            list.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.nomAuteur}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < a.note
                              ? "text-gold fill-gold"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDate(a.dateAvis)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {a.approuve ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleApprove(a, false)}
                      >
                        Masquer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-emerald hover:bg-emerald-deep text-ivory"
                        onClick={() => toggleApprove(a, true)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approuver
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Supprimer cet avis ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove(a.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-sm mt-3 text-foreground/90">
                  {a.commentaire}
                </p>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
   7. Galerie section
============================================================ */

const GALERIE_CATEGORIES = [
  "Atelier",
  "Coulisses",
  "Défilé",
  "Produits",
  "Autre",
] as const;

const GALERIE_CAT_COLORS: Record<string, string> = {
  Atelier: "bg-emerald/10 text-emerald-deep border-emerald/30",
  Coulisses: "bg-amber-100 text-amber-800 border-amber-300",
  Défilé: "bg-rose-100 text-rose-800 border-rose-300",
  Produits: "bg-gold/15 text-gold-deep border-gold/30",
  Autre: "bg-muted text-muted-foreground border-border",
};

function GalerieSection() {
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
                  src={p.url}
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
                  <AlertDialog
                    open={deleteTarget?.id === p.id}
                    onOpenChange={(o) => !o && setDeleteTarget(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 w-8 p-0"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
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
    </div>
  );
}

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

/* ============================================================
   8. Artisans section
============================================================ */

function ArtisansSection() {
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

/* ============================================================
   9. Contenu section
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

function ContenuSection() {
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
