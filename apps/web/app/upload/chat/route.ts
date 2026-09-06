import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;

const IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const AUDIO = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-wav", "audio/aac"]);
const VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const FILE = new Set([
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/aac": "aac",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/zip": "zip",
  "application/json": "json",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function kindOf(type: string): "IMAGE" | "AUDIO" | "FILE" | null {
  if (IMAGE.has(type)) return "IMAGE";
  if (AUDIO.has(type)) return "AUDIO";
  if (VIDEO.has(type) || FILE.has(type)) return "FILE";
  return null;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ code: "INVALID_BODY" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ code: "FILE_REQUIRED" }, { status: 400 });
  const type = file.type || "application/octet-stream";
  const kind = kindOf(type);
  if (!kind) return NextResponse.json({ code: "TYPE_NOT_ALLOWED" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ code: "FILE_TOO_LARGE" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads", "chat");
  await mkdir(dir, { recursive: true });
  const ext = EXT[type] ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({
    url: `/uploads/chat/${filename}`,
    name: file.name || filename,
    mime: type,
    kind,
    size: file.size,
  });
}
