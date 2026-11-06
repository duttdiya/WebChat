

const express = require("express");
const mongoose = require("mongoose");

const Message = require("../models/message");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    const connection = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId }
      ]
    });

    if (!connection) {
      return res.status(403).json({
        message: "You are not connected with this user."
      });
    }

    await Message.updateMany(
      {
        sender: userId,
        receiver: myId,
        isRead: false
      },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId }
      ]
    })
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });

  } catch (error) {
    console.error("Fetch messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages."
    });
  }
});

module.exports = router;
