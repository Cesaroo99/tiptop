import path from "node:path";

export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/3gpp": "3gp",
  "video/3gpp2": "3g2",
  "video/avi": "avi",
  "video/x-msvideo": "avi",
};

const ALLOWED_EXT = new Set(["mp4", "webm", "mov", "m4v", "3gp", "3g2", "avi"]);

export function moodsUploadDir() {
  const root = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  return path.join(root, "moods");
}

export function extFromFilename(name: string | undefined): string | null {
  const match = (name ?? "").toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) return null;
  return ALLOWED_EXT.has(match[1]) ? match[1] : null;
}

export function sniffVideoExt(bytes: Uint8Array): string | null {
  if (bytes.length >= 12) {
    const box = String.fromCharCode(...bytes.slice(4, 8));
    if (box === "ftyp") return "mp4";
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "webm";
  }
  return null;
}

export function resolveVideoExt(file: { type?: string; name?: string }, bytes: Uint8Array): string | null {
  const type = (file.type ?? "").toLowerCase().trim();
  if (type && EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
  if (type && !type.startsWith("video/") && type !== "application/octet-stream") return null;
  return extFromFilename(file.name) ?? sniffVideoExt(bytes) ?? (type.startsWith("video/") || !type ? "mp4" : null);
}

export function safeUploadName(file: string): string | null {
  if (!/^[a-f0-9-]{36}\.[a-z0-9]{2,4}$/i.test(file)) return null;
  const ext = extFromFilename(file);
  return ext ? file : null;
}
