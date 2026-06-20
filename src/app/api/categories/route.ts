import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cats = await db.categorie.findMany({
      orderBy: { ordre: "asc" },
      include: { _count: { select: { produits: true } } },
    });
    return NextResponse.json(cats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
