import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cle = searchParams.get("cle");
    if (cle) {
      const row = await db.contenu.findUnique({ where: { cle } });
      if (!row) {
        return NextResponse.json(
          { error: "Contenu introuvable" },
          { status: 404 }
        );
      }
      return NextResponse.json(row);
    }
    const rows = await db.contenu.findMany({ orderBy: { cle: "asc" } });
    return NextResponse.json(rows);
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
    const { cle, valeur } = body as { cle?: string; valeur?: string };
    if (!cle || typeof valeur !== "string") {
      return NextResponse.json(
        { error: "cle et valeur requis" },
        { status: 400 }
      );
    }
    const row = await db.contenu.upsert({
      where: { cle },
      update: { valeur },
      create: { cle, valeur },
    });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
