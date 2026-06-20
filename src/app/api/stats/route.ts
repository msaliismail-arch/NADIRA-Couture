import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    // Last 6 months window (start of month, 5 months before)
    const startOf6Months = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
      0,
      0,
      0,
      0
    );

    const [
      totalCommandes,
      commandesEnAttente,
      commandesEnConfection,
      commandesLivrees,
      totalClients,
      totalProduits,
      rdvAVenir,
      livrees,
      livreesThisMonth,
      commandes6Mois,
      recentes,
      topLignes,
    ] = await Promise.all([
      db.commande.count(),
      db.commande.count({ where: { statut: "en_attente" } }),
      db.commande.count({ where: { statut: "en_confection" } }),
      db.commande.count({ where: { statut: "livree" } }),
      db.client.count(),
      db.produit.count(),
      db.rendezVous.count({
        where: {
          statut: { in: ["planifie", "confirme"] },
          dateRdv: { gte: now },
        },
      }),
      db.commande.findMany({
        where: { statut: "livree" },
        select: { montantTotal: true },
      }),
      db.commande.findMany({
        where: { statut: "livree", dateCommande: { gte: startOfMonth } },
        select: { montantTotal: true },
      }),
      db.commande.findMany({
        where: { dateCommande: { gte: startOf6Months } },
        select: { dateCommande: true, montantTotal: true, statut: true },
      }),
      db.commande.findMany({
        take: 5,
        orderBy: { dateCommande: "desc" },
        include: { client: true },
      }),
      db.ligneCommande.groupBy({
        by: ["idProduit"],
        _sum: { quantite: true },
        orderBy: { _sum: { quantite: "desc" } },
        take: 5,
      }),
    ]);

    const caTotal = livrees.reduce((s, c) => s + c.montantTotal, 0);
    const caMois = livreesThisMonth.reduce((s, c) => s + c.montantTotal, 0);

    // Build last 6 months bucket
    const moisBuckets: { key: string; mois: string; count: number; ca: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      moisBuckets.push({
        key,
        mois: `${MONTHS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        count: 0,
        ca: 0,
      });
    }
    const bucketMap = new Map(moisBuckets.map((b) => [b.key, b]));
    for (const c of commandes6Mois) {
      const d = new Date(c.dateCommande);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.ca += c.montantTotal;
      }
    }

    // Top produits
    const topProduitIds = topLignes.map((l) => l.idProduit);
    const topProduitsRecords = topProduitIds.length
      ? await db.produit.findMany({
          where: { id: { in: topProduitIds } },
          select: { id: true, nom: true, slug: true, photos: true, prix: true },
        })
      : [];
    const topProduitsMap = new Map(topProduitsRecords.map((p) => [p.id, p]));
    type TopProduit = {
      produit: (typeof topProduitsRecords)[number];
      count: number;
    };
    const topProduits: TopProduit[] = topLignes
      .map((l): TopProduit | null => {
        const p = topProduitsMap.get(l.idProduit);
        if (!p) return null;
        return { produit: p, count: l._sum.quantite ?? 0 };
      })
      .filter((x): x is TopProduit => x !== null);

    return NextResponse.json({
      totalCommandes,
      commandesEnAttente,
      commandesEnConfection,
      commandesLivrees,
      caTotal,
      caMois,
      totalClients,
      totalProduits,
      rdvAVenir,
      topProduits,
      commandesParMois: moisBuckets.map(({ mois, count, ca }) => ({
        mois,
        count,
        ca,
      })),
      commandesRecentes: recentes,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
