import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const approuve = searchParams.get("approuve");

    // If admin token provided, return ALL reviews
    const admin = await requireAdmin(req);

    if (approuve === "true" && !admin) {
      // Public: only approved reviews
      const avis = await db.avis.findMany({
        where: { approuve: true },
        orderBy: { dateAvis: "desc" },
      });
      return NextResponse.json(avis);
    }

    // Admin: return all
    if (!admin) {
      // If no admin and no approuve filter, default to approved only (public safe)
      const avis = await db.avis.findMany({
        where: { approuve: true },
        orderBy: { dateAvis: "desc" },
      });
      return NextResponse.json(avis);
    }

    const all = await db.avis.findMany({
      orderBy: { dateAvis: "desc" },
      include: { commande: { include: { client: true } } },
    });
    return NextResponse.json(all);
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
    const { nomAuteur, note, commentaire, idCommande } = body as {
      nomAuteur?: string;
      note?: number;
      commentaire?: string;
      idCommande?: number;
    };
    if (!nomAuteur || !commentaire || note == null) {
      return NextResponse.json(
        { error: "nomAuteur, note, commentaire requis" },
        { status: 400 }
      );
    }
    const noteNum = Number(note);
    if (noteNum < 1 || noteNum > 5) {
      return NextResponse.json(
        { error: "La note doit être comprise entre 1 et 5" },
        { status: 400 }
      );
    }

    const avis = await db.avis.create({
      data: {
        nomAuteur,
        note: noteNum,
        commentaire,
        idCommande: idCommande ? Number(idCommande) : null,
        approuve: false,
      },
    });
    return NextResponse.json(avis, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const body = await req.json();
    const { id, approuve } = body as { id?: number; approuve?: boolean };
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }
    const avis = await db.avis.update({
      where: { id: Number(id) },
      data: { approuve: !!approuve },
    });
    return NextResponse.json(avis);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
