require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const userRoutes = require("./routes/users");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/message");
const ConnectionRequest = require("./models/ConnectionRequest");
const messageRoutes = require("./routes/messages");
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("WebChat backend is running!");
});
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isEmailVerified) {
      return next(new Error("Invalid user"));
    }

    socket.userId = user._id.toString();
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.userId);

  socket.join(`user:${socket.userId}`);

  socket.on("typing", async (data) => {
    try {
      const { receiverId } = data;

      if (!mongoose.Types.ObjectId.isValid(receiverId)) return;

      const connection = await ConnectionRequest.findOne({
        status: "accepted",
        $or: [
          { sender: socket.userId, receiver: receiverId },
          { sender: receiverId, receiver: socket.userId },
        ],
      });

      if (!connection) return;

      io.to(`user:${receiverId}`).emit("user_typing", {
        senderId: socket.userId,
      });
    } catch (error) {
      console.log("Typing error:", error.message);
    }
  });

  socket.on("stop_typing", async (data) => {
    try {
      const { receiverId } = data;

      if (!mongoose.Types.ObjectId.isValid(receiverId)) return;

      const connection = await ConnectionRequest.findOne({
        status: "accepted",
        $or: [
          { sender: socket.userId, receiver: receiverId },
          { sender: receiverId, receiver: socket.userId },
        ],
      });

      if (!connection) return;

      io.to(`user:${receiverId}`).emit("user_stopped_typing", {
        senderId: socket.userId,
      });
    } catch (error) {
      console.log("Stop typing error:", error.message);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const { receiverId, text } = data;

      if (
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        typeof text !== "string" ||
        !text.trim() ||
        text.trim().length > 5000
      ) {
        return socket.emit("message_error", {
          message: "Invalid message or receiver.",
        });
      }

      if (receiverId === socket.userId) {
        return socket.emit("message_error", {
          message: "You cannot message yourself.",
        });
      }

      const connection = await ConnectionRequest.findOne({
        status: "accepted",
        $or: [
          { sender: socket.userId, receiver: receiverId },
          { sender: receiverId, receiver: socket.userId },
        ],
      });

      if (!connection) {
        return socket.emit("message_error", {
          message: "You can only message connected users.",
        });
      }

      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        text: text.trim(),
      });

      const savedMessage = await Message.findById(message._id)
        .populate("sender", "name username profilePicture")
        .populate("receiver", "name username profilePicture");

      io.to(`user:${socket.userId}`)
        .to(`user:${receiverId}`)
        .emit("new_message", savedMessage);
    } catch (error) {
      console.error("Message sending error:", error);

      socket.emit("message_error", {
        message: "Could not send message.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

startServer();
