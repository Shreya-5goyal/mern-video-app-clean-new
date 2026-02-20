import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

// CRITICAL: Database configuration
mongoose.set('strictQuery', false);

import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import Message from "./models/Message.js";


const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logger for auth
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/ai')) {
    console.log(`[API] ${req.method} ${req.path} from ${req.headers.origin}`);
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// DB connection state
let isDbConnected = false;

mongoose.connection.on('connected', () => {
  isDbConnected = true;
  console.log("📦 MongoDB Connected Successfully");
});

mongoose.connection.on('error', (err) => {
  isDbConnected = false;
  console.error("❌ MongoDB Connection Error:", err.message);
});

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn("⚠️ MongoDB Disconnected. Retrying...");
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI || "mongodb://localhost:27017/webrtc_app", {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .catch((err) => {
    console.error("❌ MongoDB Initial Connection Error:", err.message);
  });

// Status Route for Debugging
app.get("/api/auth/status", (req, res) => {
  res.json({
    status: isDbConnected ? "connected" : "disconnected",
    readyState: mongoose.connection.readyState,
    dbName: mongoose.connection.name,
    env: process.env.NODE_ENV
  });
});



// WebRTC Signaling
const rooms = {};
const socketToRoom = {};
const socketToName = {}; // Track user names for chat

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

  // ============================================
  // CHAT EVENTS
  // ============================================
  socket.on("chat-join", async ({ roomId, userName }) => {
    socketToName[socket.id] = userName;
    // Notify others in the room
    socket.to(roomId).emit("user-joined-chat", { userName, socketId: socket.id });

    // Fetch and send message history
    try {
      const history = await Message.find({ roomId })
        .sort({ timestamp: 1 })
        .limit(100);
      socket.emit("chat-history", history);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  });

  socket.on("chat-message", async ({ roomId, senderName, text, timestamp, type }) => {
    // Save to database
    try {
      const newMessage = new Message({
        roomId,
        senderName,
        text,
        timestamp: timestamp || Date.now(),
        type: type || 'text'
      });
      await newMessage.save();
    } catch (err) {
      console.error("Error saving message:", err);
    }

    // Broadcast to all others in the room
    socket.to(roomId).emit("chat-message", {
      senderId: socket.id,
      senderName,
      text,
      timestamp,
      type: type || 'text',
    });
  });

  socket.on("chat-leave", ({ roomId, userName }) => {
    socket.to(roomId).emit("user-left-chat", { userName, socketId: socket.id });
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    const userName = socketToName[socket.id];
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("user-disconnected", socket.id);
      // Notify chat about user leaving
      if (userName) {
        socket.to(roomId).emit("user-left-chat", { userName, socketId: socket.id });
      }
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    delete socketToRoom[socket.id];
    delete socketToName[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}\n`);
});
