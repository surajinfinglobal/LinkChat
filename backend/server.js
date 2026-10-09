require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const connectDB = require("./config/db");
const setupSocket = require("./socket/socket");
const messageRoutes = require("./routes/messageRoutes");
const blockRoutes = require("./routes/blockRoutes");
const { connectRedis } = require("./config/redis");

const app = express();
const server = http.createServer(app);
setupSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Chat server is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use(
  "/api/conversations",
  conversationRoutes
);
app.use(
  "/api/messages",
  messageRoutes
);
app.use("/api/blocks", blockRoutes);

connectRedis().catch((error) => {
  console.error("Redis connection failed:", error);
});


// Server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server startup error:", error);
    process.exit(1);
  });