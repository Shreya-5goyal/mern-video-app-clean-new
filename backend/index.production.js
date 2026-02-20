import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import winston from "winston";

dotenv.config();

// ============================================
// PRODUCTION-GRADE LOGGER (Winston)
// ============================================
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: "webrtc-signaling" },
    transports: [
        new winston.transports.File({ filename: "./logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "./logs/combined.log" }),
    ],
});

// Console logging in development
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// ============================================
// MONGOOSE CONFIGURATION
// ============================================
mongoose.set("strictQuery", false);
import authRoutes from "./routes/authRoutes.js";
import Message from "./models/Message.js";

const app = express();
const server = http.createServer(app);

// ============================================
// CORS ORIGINS (Define early for use in Helmet)
// ============================================
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

// ============================================
// SECURITY MIDDLEWARE (Helmet)
// ============================================
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: ["'self'", ...allowedOrigins],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    })
);

// ============================================
// CORS CONFIGURATION (Production-Ready)
// ============================================
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked CORS request from origin: ${origin}`);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// ============================================
// RATE LIMITING (DDoS Protection)
// ============================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
    message: "Too many login attempts, please try again later.",
    skipSuccessfulRequests: true,
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// ============================================
// BODY PARSER WITH SIZE LIMITS
// ============================================
app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get("/health", (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: "OK",
        timestamp: Date.now(),
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    };
    res.status(200).json(healthcheck);
});

// ============================================
// ROUTES
// ============================================
app.use("/api/auth", authRoutes);

// Status endpoint
app.get("/api/status", (req, res) => {
    const status = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({
        status: states[status],
        dbName: mongoose.connection.name,
        env: process.env.NODE_ENV,
        uptime: process.uptime(),
    });
});

// ============================================
// DATABASE CONNECTION (Production-Ready)
// ============================================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    logger.error("CRITICAL: MONGO_URI is not defined in environment variables.");
    if (process.env.NODE_ENV === "production") {
        process.exit(1); // Exit in production if DB is not configured
    }
}

mongoose
    .connect(MONGO_URI || "mongodb://localhost:27017/webrtc_app", {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10, // Connection pooling
        minPoolSize: 2,
    })
    .then(() => logger.info("📦 MongoDB Connected Successfully"))
    .catch((err) => {
        logger.error("❌ MongoDB Connection Error:", err);
        if (process.env.NODE_ENV === "production") {
            process.exit(1);
        }
    });

// Handle MongoDB connection errors after initial connection
mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

// ============================================
// REDIS SETUP (For Horizontal Scaling)
// ============================================
let redisClient, redisPubClient, redisSubClient;

const initializeRedis = async () => {
    if (process.env.REDIS_URL) {
        try {
            redisClient = createClient({ url: process.env.REDIS_URL });
            redisPubClient = redisClient.duplicate();
            redisSubClient = redisClient.duplicate();

            await redisClient.connect();
            await redisPubClient.connect();
            await redisSubClient.connect();

            logger.info("✅ Redis Connected Successfully");
            return true;
        } catch (err) {
            logger.error("❌ Redis Connection Error:", err);
            return false;
        }
    } else {
        logger.warn("⚠️ REDIS_URL not set. Using in-memory storage (not suitable for production scaling)");
        return false;
    }
};

// ============================================
// SOCKET.IO CONFIGURATION (Production-Ready)
// ============================================
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    allowEIO3: true,
});

// ============================================
// ROOM MANAGEMENT (Redis or In-Memory)
// ============================================
class RoomManager {
    constructor(redisClient) {
        this.redis = redisClient;
        this.inMemoryRooms = {};
        this.inMemorySocketToRoom = {};
    }

    async addUserToRoom(roomId, socketId) {
        if (this.redis) {
            await this.redis.sAdd(`room:${roomId}`, socketId);
            await this.redis.set(`socket:${socketId}`, roomId);
        } else {
            if (!this.inMemoryRooms[roomId]) this.inMemoryRooms[roomId] = [];
            this.inMemoryRooms[roomId].push(socketId);
            this.inMemorySocketToRoom[socketId] = roomId;
        }
    }

    async getUsersInRoom(roomId) {
        if (this.redis) {
            return await this.redis.sMembers(`room:${roomId}`);
        } else {
            return this.inMemoryRooms[roomId] || [];
        }
    }

    async getRoomBySocket(socketId) {
        if (this.redis) {
            return await this.redis.get(`socket:${socketId}`);
        } else {
            return this.inMemorySocketToRoom[socketId];
        }
    }

    async removeUserFromRoom(socketId) {
        const roomId = await this.getRoomBySocket(socketId);
        if (!roomId) return;

        if (this.redis) {
            await this.redis.sRem(`room:${roomId}`, socketId);
            await this.redis.del(`socket:${socketId}`);
            const remaining = await this.redis.sCard(`room:${roomId}`);
            if (remaining === 0) {
                await this.redis.del(`room:${roomId}`);
            }
        } else {
            if (this.inMemoryRooms[roomId]) {
                this.inMemoryRooms[roomId] = this.inMemoryRooms[roomId].filter((id) => id !== socketId);
                if (this.inMemoryRooms[roomId].length === 0) {
                    delete this.inMemoryRooms[roomId];
                }
            }
            delete this.inMemorySocketToRoom[socketId];
        }
        return roomId;
    }
}

let roomManager;

// ============================================
// WEBRTC SIGNALING (Production-Ready)
// ============================================
io.on("connection", (socket) => {
    logger.info(`✓ User connected: ${socket.id}`);

    // Join room with validation
    socket.on("join-room", async (roomId) => {
        try {
            // Validate room ID
            if (!roomId || typeof roomId !== "string" || roomId.length > 20) {
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            logger.info(`📥 ${socket.id} joining room: ${roomId}`);

            await roomManager.addUserToRoom(roomId, socket.id);
            socket.join(roomId);

            const usersInRoom = await roomManager.getUsersInRoom(roomId);
            const otherUsers = usersInRoom.filter((id) => id !== socket.id);

            socket.emit("all-users", otherUsers);

            // Notify others in room
            socket.to(roomId).emit("user-joined", socket.id);
        } catch (err) {
            logger.error("Error in join-room:", err);
            socket.emit("error", { message: "Failed to join room" });
        }
    });

    // Offer with validation
    socket.on("offer", (payload) => {
        try {
            if (!payload || !payload.userToCall || !payload.sdp) {
                logger.warn("Invalid offer payload");
                return;
            }
            io.to(payload.userToCall).emit("offer", {
                sdp: payload.sdp,
                callerID: socket.id,
            });
            logger.debug(`Offer sent from ${socket.id} to ${payload.userToCall}`);
        } catch (err) {
            logger.error("Error in offer:", err);
        }
    });

    // Answer with validation
    socket.on("answer", (payload) => {
        try {
            if (!payload || !payload.callerID || !payload.sdp) {
                logger.warn("Invalid answer payload");
                return;
            }
            io.to(payload.callerID).emit("answer", {
                sdp: payload.sdp,
                id: socket.id,
            });
            logger.debug(`Answer sent from ${socket.id} to ${payload.callerID}`);
        } catch (err) {
            logger.error("Error in answer:", err);
        }
    });

    // ICE candidate with validation
    socket.on("ice-candidate", (payload) => {
        try {
            if (!payload || !payload.target || !payload.candidate) {
                logger.warn("Invalid ICE candidate payload");
                return;
            }
            io.to(payload.target).emit("ice-candidate", {
                candidate: payload.candidate,
                callerID: socket.id,
            });
        } catch (err) {
            logger.error("Error in ice-candidate:", err);
        }
    });

    // ============================================
    // CHAT EVENTS
    // ============================================
    socket.on("chat-join", async ({ roomId, userName }) => {
        logger.info(`💬 ${userName} joined chat in room: ${roomId}`);

        // Notify others
        socket.to(roomId).emit("user-joined-chat", { userName, socketId: socket.id });

        // Fetch and send history
        try {
            const history = await Message.find({ roomId })
                .sort({ timestamp: 1 })
                .limit(100);
            socket.emit("chat-history", history);
        } catch (err) {
            logger.error("Error fetching chat history:", err);
        }
    });

    socket.on("chat-message", async ({ roomId, senderName, text, timestamp, type }) => {
        try {
            const newMessage = new Message({
                roomId,
                senderName,
                text,
                timestamp: timestamp || Date.now(),
                type: type || 'text'
            });
            await newMessage.save();

            // Broadcast to others
            socket.to(roomId).emit("chat-message", {
                senderId: socket.id,
                senderName,
                text,
                timestamp,
                type: type || 'text',
            });
        } catch (err) {
            logger.error("Error in chat-message:", err);
        }
    });

    socket.on("chat-leave", ({ roomId, userName }) => {
        socket.to(roomId).emit("user-left-chat", { userName, socketId: socket.id });
    });

    // Disconnect handling
    socket.on("disconnect", async () => {
        try {
            const roomId = await roomManager.removeUserFromRoom(socket.id);
            if (roomId) {
                socket.to(roomId).emit("user-disconnected", socket.id);
                logger.info(`User ${socket.id} disconnected from room ${roomId}`);
            }
        } catch (err) {
            logger.error("Error in disconnect:", err);
        }
    });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
    logger.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        error: {
            message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        },
    });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
        logger.info("HTTP server closed");

        try {
            await mongoose.connection.close();
            logger.info("MongoDB connection closed");

            if (redisClient) {
                await redisClient.quit();
                await redisPubClient.quit();
                await redisSubClient.quit();
                logger.info("Redis connections closed");
            }

            logger.info("Graceful shutdown completed");
            process.exit(0);
        } catch (err) {
            logger.error("Error during shutdown:", err);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================
// UNCAUGHT EXCEPTION HANDLING
// ============================================
process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    const redisConnected = await initializeRedis();

    if (redisConnected) {
        io.adapter(createAdapter(redisPubClient, redisSubClient));
        logger.info("✅ Socket.IO using Redis adapter for horizontal scaling");
    }

    roomManager = new RoomManager(redisClient);

    server.listen(PORT, "0.0.0.0", () => {
        logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
        logger.info(`Redis: ${redisConnected ? "Enabled" : "Disabled (in-memory)"}`);
    });
};

startServer();
