import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const photos = await db.galerie.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(photos);
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
    const { url, legende, categorie } = body as {
      url?: string;
      legende?: string;
      categorie?: string | null;
    };
    if (!url) {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }
    const photo = await db.galerie.create({
      data: {
        url,
        legende: legende || null,
        categorie: categorie || null,
      },
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
