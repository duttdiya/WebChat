
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Message = require("../models/message");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const uploadFolder = path.join(__dirname, "../uploads/chat");

fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${require("crypto").randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// Upload photo or video
router.post("/upload/:receiverId", (req, res) => {
  upload.single("media")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        message:
          uploadError.code === "LIMIT_FILE_SIZE"
            ? "File size must not exceed 50 MB."
            : uploadError.message,
      });
    }

    let uploadedPath = req.file?.path;

    try {
      const { receiverId } = req.params;
      const myId = req.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        if (uploadedPath) fs.unlinkSync(uploadedPath);

        return res.status(400).json({
          message: "Invalid receiver ID.",
        });
      }

      if (receiverId === myId) {
        if (uploadedPath) fs.unlinkSync(uploadedPath);

        return res.status(400).json({
          message: "You cannot send media to yourself.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a photo or video.",
        });
      }

      const connection = await ConnectionRequest.findOne({
        status: "accepted",
        $or: [
          { sender: myId, receiver: receiverId },
          { sender: receiverId, receiver: myId },
        ],
      });

      if (!connection) {
        fs.unlinkSync(uploadedPath);

        return res.status(403).json({
          message: "You are not connected with this user.",
        });
      }

      const mediaType = req.file.mimetype.startsWith("image/")
        ? "image"
        : "video";

      const message = await Message.create({
        sender: myId,
        receiver: receiverId,
        text: "",
        mediaType,
        mediaUrl: `/uploads/chat/${req.file.filename}`,
        mediaName: req.file.originalname,
        isRead: false,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name username profilePicture")
        .populate("receiver", "name username profilePicture");

      const io = req.app.get("io");

      io.to(`user:${myId}`).emit("new_message", populatedMessage);
      io.to(`user:${receiverId}`).emit("new_message", populatedMessage);

      res.status(201).json({
        message: "Media sent successfully.",
        mediaMessage: populatedMessage,
      });
    } catch (error) {
      console.error("Media upload error:", error);

      if (uploadedPath && fs.existsSync(uploadedPath)) {
        fs.unlinkSync(uploadedPath);
      }

      res.status(500).json({
        message: "Failed to upload media.",
      });
    }
  });
});

// Fetch chat messages
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const connection = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });

    if (!connection) {
      return res.status(403).json({
        message: "You are not connected with this user.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages.",
    });
  }
});

module.exports = router;
