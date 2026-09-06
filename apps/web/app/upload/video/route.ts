import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Pipeline d'upload vidéo pour Mood (#4-6), façon TikTok : l'utilisateur filme
// ou importe une vidéo depuis sa galerie, elle est stockée ici et immédiatement
// servie en statique par le serveur web (cohérent avec la convention `/seed/`
// déjà utilisée pour les médias — pas de dépendance à un stockage cloud tiers).
const MAX_BYTES = 60 * 1024 * 1024; // 60 Mo
const ALLOWED_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ code: "INVALID_BODY" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ code: "FILE_REQUIRED" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ code: "VIDEO_TYPE_NOT_ALLOWED" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ code: "VIDEO_TOO_LARGE" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "moods");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/moods/${filename}` });
}
