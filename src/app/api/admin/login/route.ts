import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken, verifyPassword } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const admin = await db.administrateur.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!admin) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, admin.motDePasseHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const token = createToken({
      id: admin.id,
      nom: admin.nom,
      email: admin.email,
      role: admin.role,
    });

    return NextResponse.json({
      token,
      admin: {
        id: admin.id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
