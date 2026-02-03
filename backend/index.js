import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

// CRITICAL: Set this BEFORE importing any routes/models
mongoose.set('bufferCommands', false);

import authRoutes from "./routes/authRoutes.js";


const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ CRITICAL: MONGO_URI is not defined in environment variables.");
  if (process.env.NODE_ENV === 'production') {
    console.error("Please set MONGO_URI in your production environment settings.");
  } else {
    console.log("Using local fallback: mongodb://localhost:27017/webrtc_app");
  }
}

mongoose
  .connect(MONGO_URI || "mongodb://localhost:27017/webrtc_app", {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  .then(() => console.log("📦 MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error Detail:", err.message);
  });

// Status Route for Debugging
app.get("/api/auth/status", (req, res) => {
  const status = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: states[status],
    dbName: mongoose.connection.name,
    env: process.env.NODE_ENV
  });
});



// WebRTC Signaling
const rooms = {};
const socketToRoom = {};

io.on("connection", (socket) => {
  console.log("✓ User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`📥 ${socket.id} joining room: ${roomId}`);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    socketToRoom[socket.id] = roomId;
    socket.join(roomId);
    const usersInRoom = rooms[roomId].filter((id) => id !== socket.id);
    socket.emit("all-users", usersInRoom);
  });

  socket.on("offer", (payload) => {
    io.to(payload.userToCall).emit("offer", { sdp: payload.sdp, callerID: socket.id });
  });

  socket.on("answer", (payload) => {
    io.to(payload.callerID).emit("answer", { sdp: payload.sdp, id: socket.id });
  });

  socket.on("ice-candidate", (payload) => {
    io.to(payload.target).emit("ice-candidate", { candidate: payload.candidate, callerID: socket.id });
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("user-disconnected", socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    delete socketToRoom[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}\n`);
});
