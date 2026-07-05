import type { Server as HttpServer } from "http";
import { Server, Namespace, Socket } from "socket.io";
import { verifyAccessToken } from "@api/utils/jwt";
import type { JwtPayload } from "@api/utils/jwt";
import { MessagingService } from "./messaging.service";

const messagingService = new MessagingService();

let io: Server | undefined;
const onlineCounts = new Map<string, number>();

const conversationRoom = (id: string) => `conversation:${id}`;
const userRoom = (id: string) => `user:${id}`;

export function initSocketGateway(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  const messagingNamespace = io.of("/messaging");

  messagingNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload) {
      next(new Error("unauthorized"));
      return;
    }
    socket.data.user = payload;
    next();
  });

  messagingNamespace.on("connection", (socket) => {
    handleConnection(messagingNamespace, socket).catch(() => socket.disconnect());
  });

  return io;
}

async function handleConnection(namespace: Namespace, socket: Socket) {
  const user = socket.data.user as JwtPayload;
  socket.join(userRoom(user.id));

  const conversationIds = await messagingService.listConversationIdsForUser(
    user.id,
  );
  conversationIds.forEach((id) => socket.join(conversationRoom(id)));
  console.log(
    `[ws] connect user=${user.id} (${user.role}) socket=${socket.id} conversations=${JSON.stringify(conversationIds)}`,
  );

  const count = (onlineCounts.get(user.id) ?? 0) + 1;
  onlineCounts.set(user.id, count);
  if (count === 1) {
    conversationIds.forEach((id) =>
      namespace
        .to(conversationRoom(id))
        .emit("presence:update", { userId: user.id, online: true }),
    );
  }

  socket.on(
    "message:send",
    async (
      { conversationId, content }: { conversationId: string; content: string },
      ack?: (res: { ok: boolean; message?: unknown; error?: string }) => void,
    ) => {
      try {
        const message = await messagingService.sendMessage(
          user,
          conversationId,
          content,
        );
        const room = namespace.adapter.rooms.get(conversationRoom(conversationId));
        console.log(
          `[ws] message:send from=${user.id} conversation=${conversationId} room-sockets=${room ? room.size : 0}`,
        );
        namespace.to(conversationRoom(conversationId)).emit("message:new", message);
        ack?.({ ok: true, message });
      } catch (err) {
        console.log(`[ws] message:send FAILED from=${user.id} conversation=${conversationId}`, err);
        ack?.({
          ok: false,
          error: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    },
  );

  socket.on(
    "conversation:read",
    async ({ conversationId }: { conversationId: string }) => {
      try {
        await messagingService.markRead(conversationId, user.id);
        namespace.to(conversationRoom(conversationId)).emit("conversation:read", {
          conversationId,
          userId: user.id,
          readAt: new Date().toISOString(),
        });
      } catch {
        // L'utilisateur n'est pas/plus membre de cette conversation.
      }
    },
  );

  socket.on("typing:start", ({ conversationId }: { conversationId: string }) => {
    socket
      .to(conversationRoom(conversationId))
      .emit("typing:update", { conversationId, userId: user.id, isTyping: true });
  });

  socket.on("typing:stop", ({ conversationId }: { conversationId: string }) => {
    socket
      .to(conversationRoom(conversationId))
      .emit("typing:update", { conversationId, userId: user.id, isTyping: false });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[ws] disconnect user=${user.id} socket=${socket.id} reason=${reason}`);
    const remaining = (onlineCounts.get(user.id) ?? 1) - 1;
    if (remaining <= 0) {
      onlineCounts.delete(user.id);
      conversationIds.forEach((id) =>
        namespace
          .to(conversationRoom(id))
          .emit("presence:update", { userId: user.id, online: false }),
      );
    } else {
      onlineCounts.set(user.id, remaining);
    }
  });
}

export function getIO() {
  return io;
}

export function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
) {
  const room = io?.of("/messaging").adapter.rooms.get(conversationRoom(conversationId));
  console.log(
    `[ws] emitToConversation conversation=${conversationId} event=${event} room-sockets=${room ? room.size : 0}`,
  );
  io?.of("/messaging").to(conversationRoom(conversationId)).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  const room = io?.of("/messaging").adapter.rooms.get(userRoom(userId));
  console.log(
    `[ws] emitToUser user=${userId} event=${event} room-sockets=${room ? room.size : 0}`,
  );
  io?.of("/messaging").to(userRoom(userId)).emit(event, payload);
}

export function joinConversationRoom(userId: string, conversationId: string) {
  const before = io?.of("/messaging").adapter.rooms.get(userRoom(userId));
  console.log(
    `[ws] joinConversationRoom user=${userId} conversation=${conversationId} user-room-sockets=${before ? before.size : 0}`,
  );
  io?.of("/messaging")
    .in(userRoom(userId))
    .socketsJoin(conversationRoom(conversationId));
}
