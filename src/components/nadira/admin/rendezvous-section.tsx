"use client";

/**
 * NADIRA Couture — Admin · Rendez-vous section.
 */

import { useCallback, useEffect, useState } from "react";
import type { RendezVous } from "@/lib/types";
import { formatDateTime } from "@/lib/api";

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
import { Check, X, Phone } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";

/* ============================================================
   Rendez-vous section
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

export function RendezvousSection() {
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
