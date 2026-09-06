import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { moodsUploadDir, safeUploadName } from "@/lib/video-upload";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  avi: "video/x-msvideo",
};

export async function GET(_request: Request, ctx: { params: Promise<{ file: string }> }) {
  const params = await ctx.params;
  const file = safeUploadName(params.file);
  if (!file) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  try {
    const bytes = await readFile(path.join(moodsUploadDir(), file));
    const ext = file.split(".").pop() ?? "mp4";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[ext] ?? "video/mp4",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }
}
