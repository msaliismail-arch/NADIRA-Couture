"use client";

/**
 * NADIRA Couture — Admin · Mesures section.
 */

import { useCallback, useEffect, useState } from "react";
import type { Mesure, Client } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// lucide
import { Eye } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";

/* ============================================================
   Mesures section
============================================================ */

type MesureWithClient = Mesure & { client?: Client };

export function MesuresSection() {
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
