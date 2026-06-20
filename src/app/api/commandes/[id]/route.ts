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
    const commande = await db.commande.findUnique({
      where: { id: Number(id) },
      include: {
        client: true,
        lignes: {
          include: { produit: { include: { categorie: true } } },
        },
        avis: true,
      },
    });
    if (!commande) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json(commande);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const commandeId = Number(id);
    const body = await req.json();
    const {
      statut,
      acompte,
      modePaiement,
      notes,
      dateRetrait,
      montantTotal,
    } = body as {
      statut?: string;
      acompte?: number;
      modePaiement?: string;
      notes?: string | null;
      dateRetrait?: string | null;
      montantTotal?: number;
    };

    const existing = await db.commande.findUnique({
      where: { id: commandeId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (statut != null) data.statut = statut;
    if (acompte != null) data.acompte = Number(acompte);
    if (modePaiement != null) data.modePaiement = modePaiement;
    if (notes !== undefined) data.notes = notes || null;
    if (montantTotal != null) data.montantTotal = Number(montantTotal);
    if (dateRetrait !== undefined) {
      data.dateRetrait = dateRetrait ? new Date(dateRetrait) : null;
    }

    const commande = await db.commande.update({
      where: { id: commandeId },
      data,
      include: {
        client: true,
        lignes: { include: { produit: true } },
      },
    });
    return NextResponse.json(commande);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const commandeId = Number(id);
    // Lignes will be deleted via cascade? Schema has no cascade, so delete explicitly.
    await db.ligneCommande.deleteMany({ where: { idCommande: commandeId } });
    await db.commande.delete({ where: { id: commandeId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
