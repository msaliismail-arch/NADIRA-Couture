import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      id: admin.id,
      nom: admin.nom,
      email: admin.email,
      role: admin.role,
      dateCreation: admin.dateCreation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
