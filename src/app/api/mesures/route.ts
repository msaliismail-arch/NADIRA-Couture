import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const telephone = searchParams.get("telephone");

    // Public: find client measures by telephone (for sur-mesure prefill)
    if (telephone) {
      const client = await db.client.findFirst({
        where: { telephone },
        include: {
          mesures: { orderBy: { created_at: "desc" } },
        },
      });
      if (!client) {
        return NextResponse.json([]);
      }
      return NextResponse.json(client.mesures);
    }

    // Admin: list all mesures
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const mesures = await db.mesure.findMany({
      include: { client: true },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(mesures);
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
    const {
      idClient,
      telephone,
      tourPoitrine,
      tourTaille,
      tourHanches,
      longueurRobe,
      longueurManche,
      longueurEpaule,
      tourBras,
      notes,
    } = body as {
      idClient?: number;
      telephone?: string;
      tourPoitrine?: number;
      tourTaille?: number;
      tourHanches?: number;
      longueurRobe?: number;
      longueurManche?: number;
      longueurEpaule?: number;
      tourBras?: number;
      notes?: string;
    };

    let clientId = idClient ? Number(idClient) : null;
    if (!clientId && telephone) {
      const client = await db.client.findFirst({ where: { telephone } });
      if (client) clientId = client.id;
    }
    if (!clientId) {
      return NextResponse.json(
        { error: "idClient ou telephone (client existant) requis" },
        { status: 400 }
      );
    }

    const mesure = await db.mesure.create({
      data: {
        idClient: clientId,
        tourPoitrine: tourPoitrine ?? null,
        tourTaille: tourTaille ?? null,
        tourHanches: tourHanches ?? null,
        longueurRobe: longueurRobe ?? null,
        longueurManche: longueurManche ?? null,
        longueurEpaule: longueurEpaule ?? null,
        tourBras: tourBras ?? null,
        notes: notes || null,
      },
      include: { client: true },
    });
    return NextResponse.json(mesure, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
