"use client";

/**
 * NADIRA Couture — Admin · Avis clients section.
 */

import { useCallback, useEffect, useState } from "react";
import type { Avis } from "@/lib/types";
import { formatDate } from "@/lib/api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Star, Check, Trash2 } from "lucide-react";

// sonner
import { toast } from "sonner";

// shared
import { adminApi } from "./admin-shared";

/* ============================================================
   Avis section
============================================================ */

export function AvisSection() {
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
