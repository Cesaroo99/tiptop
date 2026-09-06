export type ChatUpload = { url: string; name: string; mime: string; kind: "IMAGE" | "AUDIO" | "FILE"; size: number };

export async function uploadChatFile(file: File): Promise<ChatUpload> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/upload/chat", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ChatUpload;
}
