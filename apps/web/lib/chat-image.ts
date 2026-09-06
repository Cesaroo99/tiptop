/** Compresse une image locale pour l’envoyer en pièce jointe chat. */
export async function readImageForChat(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("NOT_IMAGE");
  const bitmap = await createImageBitmap(file);
  const max = 960;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const data = canvas.toDataURL("image/jpeg", 0.72);
  if (data.length > 1_200_000) throw new Error("TOO_BIG");
  return data;
}
