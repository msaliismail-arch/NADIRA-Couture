import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const client = await db.client.findUnique({
      where: { id: Number(id) },
      include: {
        commandes: {
          include: {
            lignes: {
              include: { produit: { select: { id: true, nom: true, slug: true, photos: true } } },
            },
          },
          orderBy: { dateCommande: "desc" },
        },
        mesures: { orderBy: { created_at: "desc" } },
        rendezVous: { orderBy: { dateRdv: "desc" } },
      },
    });
    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json(client);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
