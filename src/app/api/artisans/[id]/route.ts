import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const artisanId = Number(id);
    const body = await req.json();
    const { nom, specialite, biographie, photo, ordre, produitIds } = body as {
      nom?: string;
      specialite?: string;
      biographie?: string | null;
      photo?: string | null;
      ordre?: number;
      produitIds?: number[];
    };

    const existing = await db.artisan.findUnique({
      where: { id: artisanId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Artisan introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (nom != null) data.nom = nom;
    if (specialite != null) data.specialite = specialite;
    if (biographie !== undefined) data.biographie = biographie || null;
    if (photo !== undefined) data.photo = photo || null;
    if (ordre != null) data.ordre = Number(ordre);

    const artisan = await db.artisan.update({
      where: { id: artisanId },
      data,
      include: {
        produits: {
          include: {
            produit: { select: { id: true, nom: true, slug: true } },
          },
        },
      },
    });

    if (Array.isArray(produitIds)) {
      await db.produitArtisan.deleteMany({
        where: { idArtisan: artisanId },
      });
      if (produitIds.length > 0) {
        await db.produitArtisan.createMany({
          data: produitIds.map((idP) => ({
            idProduit: Number(idP),
            idArtisan: artisanId,
          })),
        });
      }
    }

    return NextResponse.json(artisan);
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
    const { id } = await params;
    const artisanId = Number(id);
    await db.artisan.delete({ where: { id: artisanId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
