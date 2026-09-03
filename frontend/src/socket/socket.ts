
import { io, Socket } from "socket.io-client";

export const socket: Socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("🟢 Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("🔴 Socket disconnected:", reason);

  // Client-side disconnect hua ho to manually reconnect
  if (reason === "io client disconnect" && localStorage.getItem("user")) {
    socket.connect();
  }
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("🔄 Socket reconnect attempt:", attempt);
});

socket.io.on("reconnect", (attempt) => {
  console.log("🟢 Socket reconnected after attempts:", attempt);
});

socket.io.on("reconnect_error", (error) => {
  console.error("❌ Socket reconnect error:", error.message);
});

socket.io.on("reconnect_failed", () => {
  console.error("❌ Socket reconnect failed");
});

