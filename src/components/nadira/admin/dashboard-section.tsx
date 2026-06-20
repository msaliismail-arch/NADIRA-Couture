"use client";

/**
 * NADIRA Couture — Admin · Dashboard section (KPIs + chart + recent orders).
 * Reuses CommandeDetailDialog + ManualOrderDialog from the commandes section.
 */

import { useCallback, useEffect, useState } from "react";
import type { Commande } from "@/lib/types";
import { formatMAD, formatDate } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  ShoppingCart,
  Users,
  Clock,
  Calendar,
  Eye,
} from "lucide-react";

// (recharts removed — using lightweight CSS bar chart to avoid dev-server OOM)

// sonner
import { toast } from "sonner";

// shared
import {
  adminApi,
  KpiCard,
  MiniStat,
  DashboardSkeleton,
  ProduitThumb,
  StatutBadge,
  type Stats,
} from "./admin-shared";

// Lazy-load the heavy dialog components to keep the dashboard chunk light
import dynamic from "next/dynamic";
const CommandeDetailDialog = dynamic(
  () => import("./commandes-section").then((m) => m.CommandeDetailDialog),
  { ssr: false }
);
const ManualOrderDialog = dynamic(
  () => import("./commandes-section").then((m) => m.ManualOrderDialog),
  { ssr: false }
);

/* ============================================================
   Dashboard section
============================================================ */

export function DashboardSection() {
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
          <SimpleBarChart data={stats.commandesParMois} />
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

/* ===== Lightweight CSS bar chart (replaces recharts to avoid OOM) ===== */
function SimpleBarChart({
  data,
}: {
  data: { mois: string; count: number; ca?: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-[260px] pt-4 border-b border-border">
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * 100, 2);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative"
          >
            <span className="text-xs font-semibold text-emerald-deep opacity-0 group-hover:opacity-100 transition-opacity">
              {d.count}
            </span>
            <div
              className="w-full max-w-[48px] rounded-t-md bg-gradient-to-t from-gold-deep to-gold transition-all duration-500 hover:from-gold hover:to-gold-light"
              style={{ height: `${h}%` }}
              title={`${d.mois}: ${d.count} commande${d.count > 1 ? "s" : ""}`}
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {d.mois}
            </span>
          </div>
        );
      })}
    </div>
  );
}
