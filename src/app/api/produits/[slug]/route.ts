import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    // slug may be the slug string OR a numeric id
    const isNumeric = /^\d+$/.test(slug);
    const produit = await db.produit.findFirst({
      where: isNumeric ? { id: Number(slug) } : { slug },
      include: {
        categorie: true,
        artisans: { include: { artisan: true } },
      },
    });
    if (!produit) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json(produit);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { slug } = await params;
    const isNumeric = /^\d+$/.test(slug);
    const body = await req.json();
    const {
      nom,
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
      artisanIds,
    } = body as {
      nom?: string;
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
      artisanIds?: number[];
    };

    // Find the product first
    const existing = await db.produit.findFirst({
      where: isNumeric ? { id: Number(slug) } : { slug },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (nom != null) data.nom = nom;
    if (description != null) data.description = description;
    if (idCategorie != null) data.idCategorie = Number(idCategorie);
    if (prix != null) data.prix = Number(prix);
    if (tissu != null) data.tissu = tissu;
    if (couleurs != null) data.couleurs = couleurs;
    if (delaiRealisation != null) data.delaiRealisation = Number(delaiRealisation);
    if (occasion !== undefined) data.occasion = occasion || null;
    if (vedette != null) data.vedette = !!vedette;
    if (stock != null) data.stock = Number(stock);
    if (photos != null) data.photos = photos;

    const produit = await db.produit.update({
      where: { id: existing.id },
      data,
      include: { categorie: true, artisans: { include: { artisan: true } } },
    });

    // Sync artisans if provided
    if (Array.isArray(artisanIds)) {
      await db.produitArtisan.deleteMany({
        where: { idProduit: existing.id },
      });
      if (artisanIds.length > 0) {
        await db.produitArtisan.createMany({
          data: artisanIds.map((idA) => ({
            idProduit: existing.id,
            idArtisan: Number(idA),
          })),
        });
      }
    }

    return NextResponse.json(produit);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { slug } = await params;
    const isNumeric = /^\d+$/.test(slug);
    const existing = await db.produit.findFirst({
      where: isNumeric ? { id: Number(slug) } : { slug },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }
    await db.produit.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
