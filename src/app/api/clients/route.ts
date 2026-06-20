import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const clients = await db.client.findMany({
      include: {
        _count: { select: { commandes: true } },
      },
      orderBy: { dateInscription: "desc" },
    });
    return NextResponse.json(clients);
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
    const { nom, prenom, telephone, email, adresse } = body as {
      nom?: string;
      prenom?: string;
      telephone?: string;
      email?: string;
      adresse?: string;
    };
    if (!nom || !prenom || !telephone) {
      return NextResponse.json(
        { error: "nom, prenom, telephone requis" },
        { status: 400 }
      );
    }

    // Find or create by telephone
    let client = await db.client.findFirst({ where: { telephone } });
    if (!client) {
      client = await db.client.create({
        data: {
          nom,
          prenom,
          telephone,
          email: email || null,
          adresse: adresse || null,
        },
      });
    } else {
      // Optionally fill missing info
      client = await db.client.update({
        where: { id: client.id },
        data: {
          email: client.email || email || null,
          adresse: client.adresse || adresse || null,
        },
      });
    }
    return NextResponse.json(client);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
