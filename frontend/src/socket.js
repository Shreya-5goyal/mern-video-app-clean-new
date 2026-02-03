import { io } from "socket.io-client";

// Use current hostname (localhost or IP on LAN)
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const host = window.location.hostname;
const port = "5000";

export const socket = io(`${window.location.protocol}//${host}:${port}`, {
  transports: ["websocket"],
});
