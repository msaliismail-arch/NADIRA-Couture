import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const cats = await db.categorie.findMany({
      orderBy: { ordre: "asc" },
      include: { _count: { select: { produits: true } } },
    });
    return NextResponse.json(cats, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
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
    const { libelle, slug, ordre } = body as {
      libelle?: string;
      slug?: string;
      ordre?: number;
    };
    if (!libelle || !slug) {
      return NextResponse.json(
        { error: "Libellé et slug requis" },
        { status: 400 }
      );
    }
    // Determine the next ordre if not provided
    const maxOrdre = await db.categorie.aggregate({ _max: { ordre: true } });
    const nextOrdre = ordre ?? (maxOrdre._max.ordre ?? 0) + 1;
    const cat = await db.categorie.create({
      data: {
        libelle,
        slug,
        ordre: nextOrdre,
      },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
