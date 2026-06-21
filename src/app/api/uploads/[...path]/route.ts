import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * Serves uploaded files from /public/uploads/.
 * This bypasses the Next.js static file server, which may not serve
 * newly created files reliably in dev mode (especially with Turbopack).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    // Only allow serving files from the uploads directory
    const filename = segments.join("/");
    
    // Prevent path traversal attacks
    if (filename.includes("..") || filename.includes("\\")) {
      return new NextResponse("Not found", { status: 404 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    // Ensure the resolved path is still within the uploads directory
    if (!filepath.startsWith(uploadDir)) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!existsSync(filepath)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const fileStats = await stat(filepath);
    if (!fileStats.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer = await readFile(filepath);

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
