
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/search", async (req, res) => {
  try {
    const search = req.query.q?.trim();

    if (!search) {
      return res.status(400).json({
        message: "Please enter an email or username.",
      });
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    const users = await User.find({
      _id: { $ne: req.user._id },
      isEmailVerified: true,
      $or: [
        { email: searchRegex },
        { username: searchRegex },
      ],
    })
      .select("name email username profilePicture")
      .limit(20);

    res.status(200).json({ users });
  } catch (error) {
    console.error("User search error:", error.message);
    res.status(500).json({
      message: "Unable to search users.",
    });
  }
});

router.post("/request/:userId", async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({
        message: "You cannot send a request to yourself.",
      });
    }

    const receiver = await User.findOne({
      _id: receiverId,
      isEmailVerified: true,
    });

    if (!receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === "accepted") {
        return res.status(409).json({
          message: "You are already connected.",
        });
      }

      if (existingRequest.status === "pending") {
        return res.status(409).json({
          message: "A connection request already exists.",
        });
      }

      existingRequest.sender = senderId;
      existingRequest.receiver = receiverId;
      existingRequest.status = "pending";
      await existingRequest.save();

      return res.status(200).json({
        message: "Connection request sent successfully.",
      });
    }

    await ConnectionRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    return res.status(201).json({
      message: "Connection request sent successfully.",
    });
  } catch (error) {
    console.error("Send request error:", error.message);
    return res.status(500).json({
      message: "Unable to send connection request.",
    });
  }
});

router.get("/requests/received", async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      receiver: req.user._id,
      status: "pending",
    })
      .populate("sender", "name email username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Fetch requests error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch connection requests.",
    });
  }
});

router.patch("/requests/:requestId", async (req, res) => {
  try {
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        message: "Action must be accept or reject.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({
        message: "Invalid request ID.",
      });
    }

    const request = await ConnectionRequest.findOne({
      _id: req.params.requestId,
      receiver: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        message: "Pending connection request not found.",
      });
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    await request.save();

    return res.status(200).json({
      message:
        action === "accept"
          ? "Connection request accepted."
          : "Connection request rejected.",
      request,
    });
  } catch (error) {
    console.error("Respond to request error:", error.message);
    return res.status(500).json({
      message: "Unable to update connection request.",
    });
  }
});

router.get("/connection-status/:userId", async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const request = await ConnectionRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id },
      ],
    });

    if (!request) {
      return res.status(200).json({ status: "none" });
    }

    let status = request.status;

    if (status === "pending") {
      status =
        request.sender.toString() === req.user._id.toString()
          ? "sent"
          : "received";
    }

    return res.status(200).json({ status });
  } catch (error) {
    console.error("Connection status error:", error.message);
    return res.status(500).json({
      message: "Unable to check connection status.",
    });
  }
});

router.get("/connections", async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId },
      ],
    })
      .populate("sender", "name email username profilePicture")
      .populate("receiver", "name email username profilePicture")
      .sort({ updatedAt: -1 });

    const connectedUsers = connections.map((connection) => {
      const otherUser =
        connection.sender._id.toString() === currentUserId.toString()
          ? connection.receiver
          : connection.sender;

      return {
        requestId: connection._id,
        user: otherUser,
      };
    });

    return res.status(200).json({
      connections: connectedUsers,
    });
  } catch (error) {
    console.error("Fetch connections error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch connections.",
    });
  }
});

module.exports = router;
