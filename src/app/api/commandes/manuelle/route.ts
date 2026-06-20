import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { generateReference } from "@/lib/reference";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const body = await req.json();
    const {
      idClient,
      newClient,
      lignes,
      mesures,
      dateRetrait,
      statut,
      modePaiement,
      acompte,
      notes,
    } = body as {
      idClient?: number;
      newClient?: {
        nom: string;
        prenom: string;
        telephone: string;
        email?: string;
        adresse?: string;
      };
      lignes: {
        idProduit: number;
        quantite?: number;
        prixUnitaire?: number;
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
      statut?: string;
      modePaiement?: string;
      acompte?: number;
      notes?: string;
    };

    if (!Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { error: "Lignes de commande requises" },
        { status: 400 }
      );
    }

    // Resolve client
    let clientId: number;
    if (idClient) {
      const existing = await db.client.findUnique({
        where: { id: Number(idClient) },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Client introuvable" },
          { status: 400 }
        );
      }
      clientId = existing.id;
    } else if (newClient) {
      if (!newClient.nom || !newClient.prenom || !newClient.telephone) {
        return NextResponse.json(
          { error: "nom, prenom, telephone du nouveau client requis" },
          { status: 400 }
        );
      }
      const created = await db.client.create({
        data: {
          nom: newClient.nom,
          prenom: newClient.prenom,
          telephone: newClient.telephone,
          email: newClient.email || null,
          adresse: newClient.adresse || null,
        },
      });
      clientId = created.id;
    } else {
      return NextResponse.json(
        { error: "idClient ou newClient requis" },
        { status: 400 }
      );
    }

    // Create mesure if provided
    let mesureId: number | null = null;
    if (mesures) {
      const mesure = await db.mesure.create({
        data: {
          idClient: clientId,
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

    // Validate produits & compute total (prefer explicit prixUnitaire)
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
      const pu = l.prixUnitaire != null ? Number(l.prixUnitaire) : p.prix;
      return sum + pu * (l.quantite ?? 1);
    }, 0);

    const commande = await db.commande.create({
      data: {
        reference,
        idClient: clientId,
        statut: statut || "en_attente",
        montantTotal,
        modePaiement: modePaiement || "atelier",
        acompte: acompte != null ? Number(acompte) : 0,
        notes:
          (notes ? notes + (mesureId ? "\n" : "") : "") +
          (mesureId ? `Mesures: id=${mesureId}` : "") || null,
        dateRetrait: dateRetrait ? new Date(dateRetrait) : null,
        lignes: {
          create: lignes.map((l) => {
            const p = prodMap.get(Number(l.idProduit))!;
            const pu = l.prixUnitaire != null ? Number(l.prixUnitaire) : p.prix;
            return {
              idProduit: p.id,
              quantite: l.quantite ?? 1,
              prixUnitaire: pu,
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
