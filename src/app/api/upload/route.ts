import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

// إنشاء الاتصال مع Supabase باستخدام المفاتيح السرية
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    // Validate type
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jpg",
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté" },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 Mo)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename preserving extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${randomUUID()}.${ext}`;

    // رفع الصورة إلى Supabase Storage (فـ Bucket سميتو uploads)
    const { error } = await supabase.storage
      .from("uploads")
      .upload(filename, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(error.message);
    }

    // استرجاع الرابط العام (Public URL) ديال الصورة
    const { data } = supabase.storage.from("uploads").getPublicUrl(filename);

    // إرجاع الرابط للـ Frontend
    return NextResponse.json({ url: data.publicUrl });
    
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}