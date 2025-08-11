const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/database");
const { clerkMiddleware } = require("@clerk/express");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chats");
const messageRoutes = require("./routes/messages");

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO - only use CORS in development
const io = new Server(server, {
  cors:
    process.env.NODE_ENV !== "production"
      ? {
          origin: "http://localhost:3000",
          methods: ["GET", "POST"],
        }
      : {},
});

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// Rate limiting - increased for chat application
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for chat app)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api/", limiter);

// CORS configuration - only use CORS in development
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Clerk authentication middleware
app.use(clerkMiddleware());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb: "connected",
    port: process.env.PORT || 5000,
  });
});

// Root route for debugging
app.get("/", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const indexPath = path.join(__dirname, "../frontend/build/index.html");
    console.log("🏠 Root route - serving index.html from:", indexPath);
    res.sendFile(indexPath);
  } else {
    res.json({ message: "Enhanced Chat Platform API - Development Mode" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/build");
  console.log("📁 Serving static files from:", buildPath);

  app.use(express.static(buildPath));

  // Catch-all handler: send back React's index.html file for non-API routes
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      const indexPath = path.join(buildPath, "index.html");
      console.log("🏠 Serving index.html for:", req.path);
      res.sendFile(indexPath);
    }
  });
}

// Socket.IO connection handling
const socketHandler = require("./utils/socketHandler");
socketHandler(io);

// Error handling middleware (must be after routes)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// Global error handlers for uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});
app.use(errorHandler);

// 404 handler for API routes only
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
