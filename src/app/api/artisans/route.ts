import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const artisans = await db.artisan.findMany({
      orderBy: { ordre: "asc" },
      include: {
        produits: {
          include: {
            produit: {
              select: { id: true, nom: true, slug: true },
            },
          },
        },
      },
    });
    return NextResponse.json(artisans);
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
    const { nom, specialite, biographie, photo, ordre, produitIds } = body as {
      nom?: string;
      specialite?: string;
      biographie?: string | null;
      photo?: string | null;
      ordre?: number;
      produitIds?: number[];
    };
    if (!nom || !specialite) {
      return NextResponse.json(
        { error: "nom et specialite requis" },
        { status: 400 }
      );
    }
    const artisan = await db.artisan.create({
      data: {
        nom,
        specialite,
        biographie: biographie || null,
        photo: photo || null,
        ordre: ordre != null ? Number(ordre) : 0,
        produits:
          Array.isArray(produitIds) && produitIds.length > 0
            ? {
                create: produitIds.map((idP) => ({
                  idProduit: Number(idP),
                })),
              }
            : undefined,
      },
      include: {
        produits: {
          include: {
            produit: { select: { id: true, nom: true, slug: true } },
          },
        },
      },
    });
    return NextResponse.json(artisan, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
