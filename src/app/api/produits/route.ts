import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorie = searchParams.get("categorie");
    const vedette = searchParams.get("vedette");
    const recherche = searchParams.get("recherche");
    const couleur = searchParams.get("couleur");
    const tissu = searchParams.get("tissu");

    const where: Prisma.ProduitWhereInput = {};
    if (categorie) {
      where.categorie = { slug: categorie };
    }
    if (vedette === "true") where.vedette = true;
    if (tissu) {
      where.tissu = { contains: tissu };
    }
    if (couleur) {
      where.couleurs = { contains: couleur };
    }
    if (recherche) {
      where.OR = [
        { nom: { contains: recherche } },
        { description: { contains: recherche } },
        { tissu: { contains: recherche } },
      ];
    }

    const produits = await db.produit.findMany({
      where,
      include: { categorie: true },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(produits);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const body = await req.json();
    const {
      nom,
      slug,
      description,
      idCategorie,
      prix,
      tissu,
      couleurs,
      delaiRealisation,
      occasion,
      vedette,
      stock,
      photos,
      longueur,
      largeur,
      tourPoitrine,
      tourTaille,
      tourHanches,
      longueurManche,
      autreDimensions,
      datePiece,
    } = body as {
      nom?: string;
      slug?: string;
      description?: string;
      idCategorie?: number;
      prix?: number;
      tissu?: string;
      couleurs?: string;
      delaiRealisation?: number;
      occasion?: string | null;
      vedette?: boolean;
      stock?: number;
      photos?: string;
      longueur?: number | null;
      largeur?: number | null;
      tourPoitrine?: number | null;
      tourTaille?: number | null;
      tourHanches?: number | null;
      longueurManche?: number | null;
      autreDimensions?: string | null;
      datePiece?: string | null;
    };

    if (!nom || !slug || !description || !idCategorie || prix == null || !tissu || !couleurs || !photos) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const produit = await db.produit.create({
      data: {
        nom,
        slug,
        description,
        idCategorie: Number(idCategorie),
        prix: Number(prix),
        tissu,
        couleurs,
        delaiRealisation: delaiRealisation ? Number(delaiRealisation) : 21,
        occasion: occasion || null,
        vedette: !!vedette,
        stock: stock != null ? Number(stock) : 1,
        photos,
        longueur: longueur != null && longueur !== "" ? Number(longueur) : null,
        largeur: largeur != null && largeur !== "" ? Number(largeur) : null,
        tourPoitrine: tourPoitrine != null && tourPoitrine !== "" ? Number(tourPoitrine) : null,
        tourTaille: tourTaille != null && tourTaille !== "" ? Number(tourTaille) : null,
        tourHanches: tourHanches != null && tourHanches !== "" ? Number(tourHanches) : null,
        longueurManche: longueurManche != null && longueurManche !== "" ? Number(longueurManche) : null,
        autreDimensions: autreDimensions || null,
        datePiece: datePiece ? new Date(datePiece) : null,
      },
      include: { categorie: true },
    });
    return NextResponse.json(produit, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
