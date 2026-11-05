
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function hashOtp(otp) {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(otp)
    .digest("hex");
}


router.post("/signup", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      return res.status(400).json({ message: "Enter a valid phone number." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user?.isEmailVerified) {
      return res.status(409).json({
        message: "This email is already registered. Please log in.",
      });
    }

    const existingPhone = await User.findOne({
      phone: phone.trim(),
      ...(user ? { _id: { $ne: user._id } } : {}),
    });

    if (existingPhone) {
      return res.status(409).json({
        message: "This phone number is already registered.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    if (!user) {
      user = new User({
        name: name.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
      });
    } else {
      user.name = name.trim();
      user.phone = phone.trim();
      user.password = await bcrypt.hash(password, 12);
    }

    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;

    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: "Your WebChat verification code",
        text: `Your WebChat OTP is ${otp}. It expires in 10 minutes.`,
      });
    } catch (emailError) {
      user.otpHash = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      console.error("Email delivery failed:", emailError.message);

      return res.status(502).json({
        message: "Could not send the email. Check your email configuration.",
      });
    }

    return res.status(200).json({
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Signup failed." });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !/^\d{6}$/.test(otp || "")) {
      return res.status(400).json({
        message: "Enter your email and a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.isEmailVerified || !user.otpHash) {
      return res.status(400).json({
        message: "No pending verification. Please sign up again.",
      });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
      user.otpHash = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      return res.status(400).json({
        message: "OTP expired. Please sign up again to request a new one.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many attempts. Please sign up again to request a new code.",
      });
    }

    user.otpAttempts += 1;

    if (hashOtp(otp) !== user.otpHash) {
      await user.save();
      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
      });
    }

    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;

await user.save();

const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

return res.status(200).json({
  message: "Email verified successfully.",
  token,
});

  } catch (error) {
    console.error("OTP verification error:", error.message);
    return res.status(500).json({
      message: "OTP verification failed.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Please enter email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to login. Please try again.",
    });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Please enter your email.",
      });
    }

    const user = await User.findOne({
      email,
      isEmailVerified: true,
    });

    if (!user) {
      return res.status(200).json({
        message: "If your account exists, a reset OTP has been sent.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;

    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "WebChat Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
      });
    } catch (emailError) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiresAt = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      throw emailError;
    }

    return res.status(200).json({
      message: "Password reset OTP sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      message: "Unable to send reset OTP.",
    });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Enter a valid 6-digit OTP.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      isEmailVerified: true,
    });

    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    if (user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request another one.",
      });
    }

    if (user.resetOtpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    if (hashOtp(otp) !== user.resetOtpHash) {
      user.resetOtpAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Incorrect OTP.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    user.resetOtpAttempts = 0;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      message: "Unable to reset password.",
    });
  }
});
module.exports = router;
