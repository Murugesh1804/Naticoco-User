// src/services/socketService.js

import { io } from "socket.io-client";

const SOCKET_URL = "http://147.93.110.87:3500"; // Replace with your backend URL

// Initialize the socket
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

socket.on("connect", () => {
  console.log("Socket connected with ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

export default socket;
