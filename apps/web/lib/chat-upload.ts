import { getStoredToken } from "./api";

export type ChatUpload = { url: string; name: string; mime: string; kind: "IMAGE" | "AUDIO" | "FILE"; size: number };

export async function uploadChatFile(file: File): Promise<ChatUpload> {
  const form = new FormData();
  form.append("file", file);
  const headers = new Headers();
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch("/upload/chat", {
    method: "POST",
    body: form,
    headers,
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ChatUpload;
}
