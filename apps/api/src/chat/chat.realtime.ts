import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";

@Injectable()
export class ChatRealtime {
  private server: Server | null = null;
  private sockets = new Map<string, Set<string>>();
  private viewing = new Map<string, Set<string>>();

  attach(server: Server) {
    this.server = server;
  }

  addSocket(userId: string, socketId: string) {
    const set = this.sockets.get(userId) ?? new Set();
    set.add(socketId);
    this.sockets.set(userId, set);
  }

  removeSocket(userId: string, socketId: string) {
    const set = this.sockets.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) {
      this.sockets.delete(userId);
      this.viewing.delete(userId);
    }
  }

  isConnected(userId: string) {
    return (this.sockets.get(userId)?.size ?? 0) > 0;
  }

  view(userId: string, conversationId: string) {
    const set = this.viewing.get(userId) ?? new Set();
    set.add(conversationId);
    this.viewing.set(userId, set);
  }

  unview(userId: string, conversationId: string) {
    this.viewing.get(userId)?.delete(conversationId);
  }

  isViewing(userId: string, conversationId: string) {
    return this.viewing.get(userId)?.has(conversationId) ?? false;
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    if (!this.server) return;
    for (const id of userIds) {
      this.server.to(`user:${id}`).emit(event, payload);
    }
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(`conv:${conversationId}`).emit(event, payload);
  }
}
