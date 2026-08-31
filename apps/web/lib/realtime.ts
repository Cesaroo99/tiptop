"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getStoredToken } from "./api";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Handler = (payload: unknown) => void;

let socket: Socket | null = null;
const handlers = new Map<string, Set<Handler>>();

function ensureSocket() {
  const token = getStoredToken();
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }
  socket = io(`${apiBase}/realtime`, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });
  socket.onAny((event, payload) => {
    handlers.get(event)?.forEach((fn) => fn(payload));
  });
  return socket;
}

export function useRealtime(event: string, handler: Handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const s = ensureSocket();
    if (!s) return;
    const wrap: Handler = (p) => ref.current(p);
    const set = handlers.get(event) ?? new Set();
    set.add(wrap);
    handlers.set(event, set);
    return () => {
      set.delete(wrap);
    };
  }, [event]);
}

export function realtimeEmit(event: string, payload: unknown) {
  ensureSocket()?.emit(event, payload);
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
