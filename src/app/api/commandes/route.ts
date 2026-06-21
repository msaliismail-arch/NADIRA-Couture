import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateReference } from "@/lib/reference";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    // Public: track order by reference — no admin required
    if (reference) {
      const commande = await db.commande.findUnique({
        where: { reference },
        include: {
          lignes: {
            include: {
              produit: { include: { categorie: true } },
            },
          },
        },
      });
      if (!commande) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }
      return NextResponse.json(commande);
    }

    // Admin: list all commandes
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const commandes = await db.commande.findMany({
      include: {
        client: true,
        lignes: {
          include: { produit: { select: { id: true, nom: true, slug: true, photos: true } } },
        },
      },
      orderBy: { dateCommande: "desc" },
    });
    return NextResponse.json(commandes);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nom,
      prenom,
      telephone,
      email,
      ville,
      adresse,
      lignes,
      mesures,
      dateRetrait,
      notes,
    } = body as {
      nom?: string;
      prenom?: string;
      telephone?: string;
      email?: string;
      ville?: string;
      adresse?: string;
      lignes?: {
        idProduit: number;
        quantite?: number;
        surMesure?: boolean;
        taille?: string | null;
        couleur?: string | null;
      }[];
      mesures?: {
        tourPoitrine?: number;
        tourTaille?: number;
        tourHanches?: number;
        longueurRobe?: number;
        longueurManche?: number;
        longueurEpaule?: number;
        tourBras?: number;
        notes?: string;
      };
      dateRetrait?: string;
      notes?: string;
    };

    if (!nom || !prenom || !telephone || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Find or create client by telephone
    let client = await db.client.findFirst({ where: { telephone } });
    if (!client) {
      client = await db.client.create({
        data: {
          nom,
          prenom,
          telephone,
          email: email || null,
          ville: ville || null,
          adresse: adresse || null,
        },
      });
    } else {
      // Optionally update missing fields
      client = await db.client.update({
        where: { id: client.id },
        data: {
          email: client.email || email || null,
          ville: client.ville || ville || null,
          adresse: client.adresse || adresse || null,
        },
      });
    }

    // Create mesure if provided
    let mesureId: number | null = null;
    if (mesures) {
      const mesure = await db.mesure.create({
        data: {
          idClient: client.id,
          tourPoitrine: mesures.tourPoitrine ?? null,
          tourTaille: mesures.tourTaille ?? null,
          tourHanches: mesures.tourHanches ?? null,
          longueurRobe: mesures.longueurRobe ?? null,
          longueurManche: mesures.longueurManche ?? null,
          longueurEpaule: mesures.longueurEpaule ?? null,
          tourBras: mesures.tourBras ?? null,
          notes: mesures.notes || null,
        },
      });
      mesureId = mesure.id;
    }

    // Validate produits and compute total
    const produitIds = lignes.map((l) => Number(l.idProduit));
    const produits = await db.produit.findMany({
      where: { id: { in: produitIds } },
    });
    const prodMap = new Map(produits.map((p) => [p.id, p]));
    for (const l of lignes) {
      if (!prodMap.has(Number(l.idProduit))) {
        return NextResponse.json(
          { error: `Produit ${l.idProduit} introuvable` },
          { status: 400 }
        );
      }
    }

    const reference = generateReference();
    const montantTotal = lignes.reduce((sum, l) => {
      const p = prodMap.get(Number(l.idProduit))!;
      return sum + p.prix * (l.quantite ?? 1);
    }, 0);

    const commande = await db.commande.create({
      data: {
        reference,
        idClient: client.id,
        statut: "en_attente",
        montantTotal,
        modePaiement: "atelier",
        acompte: 0,
        notes:
          (notes ? notes + (mesureId ? "\n" : "") : "") +
          (mesureId ? `Mesures: id=${mesureId}` : "") || null,
        dateRetrait: dateRetrait ? new Date(dateRetrait) : null,
        lignes: {
          create: lignes.map((l) => {
            const p = prodMap.get(Number(l.idProduit))!;
            return {
              idProduit: p.id,
              quantite: l.quantite ?? 1,
              prixUnitaire: p.prix,
              surMesure: !!l.surMesure,
              taille: l.taille || null,
              couleur: l.couleur || null,
            };
          }),
        },
      },
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });

    return NextResponse.json({ commande, reference }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
