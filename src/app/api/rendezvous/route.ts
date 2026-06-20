import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const rdvs = await db.rendezVous.findMany({
      orderBy: { dateRdv: "asc" },
      include: { client: true },
    });
    return NextResponse.json(rdvs);
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
    const { nom, telephone, email, dateRdv, type, notes } = body as {
      nom?: string;
      telephone?: string;
      email?: string;
      dateRdv?: string;
      type?: string;
      notes?: string;
    };
    if (!nom || !telephone || !dateRdv) {
      return NextResponse.json(
        { error: "nom, telephone, dateRdv requis" },
        { status: 400 }
      );
    }

    // Try to link to existing client by telephone
    const client = await db.client.findFirst({ where: { telephone } });

    const rdv = await db.rendezVous.create({
      data: {
        nom,
        telephone,
        email: email || null,
        dateRdv: new Date(dateRdv),
        type: type || "essayage",
        statut: "planifie",
        notes: notes || null,
        idClient: client?.id ?? null,
      },
      include: { client: true },
    });
    return NextResponse.json(rdv, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
