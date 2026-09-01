import { Inject, Injectable } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import { ChatRealtime } from "./chat.realtime";
import { ChatService } from "./chat.service";
import { PushService } from "./push.service";
import { loadEnv } from "../env";

const env = loadEnv();

@WebSocketGateway({
  namespace: "/realtime",
  cors: { origin: env.WEB_ORIGIN, credentials: true },
})
@Injectable()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ChatRealtime) private readonly realtime: ChatRealtime,
    @Inject(ChatService) private readonly chat: ChatService,
    @Inject(PushService) private readonly push: PushService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
  }

  async handleConnection(client: Socket) {
    const raw = client.handshake.auth?.token || client.handshake.query?.token;
    const token = Array.isArray(raw) ? raw[0] : raw;
    const user = token ? await this.auth.resolveSession(String(token)) : null;
    if (!user) {
      client.disconnect();
      return;
    }
    client.data.userId = user.id;
    client.join(`user:${user.id}`);
    this.realtime.addSocket(user.id, client.id);
    await this.push.registerDevice(user.id, "web");
    await this.push.touch(user.id);
    const ids = await this.chat.conversationIds(user.id);
    for (const id of ids) client.join(`conv:${id}`);
    for (const id of ids) {
      this.realtime.emitToConversation(id, "presence", { userId: user.id, online: true });
    }
    client.emit("hello", { userId: user.id });
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    this.realtime.removeSocket(userId, client.id);
    if (!this.realtime.isConnected(userId)) {
      await this.push.touch(userId);
      const ids = await this.chat.conversationIds(userId);
      for (const id of ids) {
        this.realtime.emitToConversation(id, "presence", { userId, online: false });
      }
    }
  }

  @SubscribeMessage("join")
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId?: string }) {
    const userId = client.data.userId as string;
    if (!body?.conversationId) return;
    await this.chat.assertMemberById(userId, body.conversationId);
    client.join(`conv:${body.conversationId}`);
    this.realtime.view(userId, body.conversationId);
    await this.chat.read(userId, body.conversationId);
  }

  @SubscribeMessage("leave")
  leave(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId?: string }) {
    const userId = client.data.userId as string;
    if (!body?.conversationId) return;
    this.realtime.unview(userId, body.conversationId);
  }

  @SubscribeMessage("typing")
  typing(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId?: string }) {
    const userId = client.data.userId as string;
    if (!body?.conversationId) return;
    this.realtime.emitToConversation(body.conversationId, "typing", {
      conversationId: body.conversationId,
      userId,
    });
  }
}
