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
    const body = await req.json();
    const { libelle, slug, ordre } = body as {
      libelle?: string;
      slug?: string;
      ordre?: number;
    };
    const data: Record<string, unknown> = {};
    if (libelle != null) data.libelle = libelle;
    if (slug != null) data.slug = slug;
    if (ordre != null) data.ordre = ordre;
    const cat = await db.categorie.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(cat);
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
    // Check if category has products
    const count = await db.produit.count({ where: { idCategorie: Number(id) } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : ${count} produit(s) utilisent cette catégorie. Réassignez-les d'abord.` },
        { status: 400 }
      );
    }
    await db.categorie.delete({ where: { id: Number(id) } });
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
