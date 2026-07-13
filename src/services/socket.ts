import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  // Clean token: strip whitespace, 'Bearer ' prefix, and outer quotes
  let cleanToken = token.trim();
  if (cleanToken.toLowerCase().startsWith("bearer ")) {
    cleanToken = cleanToken.slice(7).trim();
  }
  if (
    (cleanToken.startsWith('"') && cleanToken.endsWith('"')) ||
    (cleanToken.startsWith("'") && cleanToken.endsWith("'"))
  ) {
    cleanToken = cleanToken.slice(1, -1);
  }

  console.log("token", cleanToken);
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }
  const socketUrl = (import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:5000";
  console.log("Connecting to:", socketUrl);
  socket = io(socketUrl, {
    transports: ["websocket"],
    auth: {
      token: cleanToken,
    },
  });

  socket.on("connect", () => {
    console.log("✅ Socket Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Socket Error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
