import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { MAX_VIDEO_BYTES, moodsUploadDir, resolveVideoExt } from "@/lib/video-upload";

export const runtime = "nodejs";

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
  if (file.size <= 0 || file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ code: "VIDEO_TOO_LARGE" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = resolveVideoExt({ type: file.type, name: file.name }, bytes);
  if (!ext) {
    return NextResponse.json({ code: "VIDEO_TYPE_NOT_ALLOWED" }, { status: 400 });
  }

  const dir = moodsUploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/moods/${filename}` });
}
