
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});


router.put(
  "/setup",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { username, dob, bio } = req.body;

      // Get the authenticated user from middleware
      const user = req.user;

      if (!username?.trim() || !dob) {
        return res.status(400).json({
          message: "Username and date of birth are required.",
        });
      }

      const normalizedUsername = username.trim().toLowerCase();

      // Check whether username is already taken
      const existingUsername = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      });

      if (existingUsername) {
        return res.status(409).json({
          message: "This username is already taken.",
        });
      }

      // Update authenticated user's profile
      user.username = normalizedUsername;
      user.dob = dob;
      user.bio = bio?.trim() || "";

      if (req.file) {
        user.profilePicture = `/uploads/${req.file.filename}`;
      }

      await user.save();

      return res.status(200).json({
        message: "Profile saved successfully.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          dob: user.dob,
          bio: user.bio,
          profilePicture: user.profilePicture,
        },
      });

    } catch (error) {
      console.error("Profile save error:", error.message);

      return res.status(500).json({
        message: "Unable to save profile.",
      });
    }
  }
);


router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        dob: user.dob,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    });

  } catch (error) {
    console.error("Profile fetch error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch profile.",
    });
  }
});


module.exports = router;
