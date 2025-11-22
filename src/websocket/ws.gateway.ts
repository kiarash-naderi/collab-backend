import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { authenticateWebSocket } from "./ws.middleware.js";
import { handleWebSocketConnection } from "./ws.handler.js";
import { WSAuthClient } from "./ws.message-types.js";

export const setupWebSocketServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ noServer: true });
  (globalThis as any).wss = wss;

  const interval = setInterval(() => {
    wss.clients.forEach((ws: unknown) => {
      const client = ws as WSAuthClient;
      if (!client.isAlive) return client.terminate();
      client.isAlive = false;
      client.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(interval));

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const documentId = url.searchParams.get("documentId");

    if (!documentId) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const payload = authenticateWebSocket(request);

      wss.handleUpgrade(request, socket, head, (ws) => {
        const authenticatedWs = ws as WSAuthClient;
        authenticatedWs.server = wss;
        authenticatedWs.upgradeReq = request; 
        
        wss.emit("connection", authenticatedWs, request);
        handleWebSocketConnection(authenticatedWs, documentId, payload.userId);
      });
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });

  console.log("WebSocket server is ready");
};