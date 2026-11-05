const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    dob: Date,
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    otpHash: {
      type: String,
      default: undefined,
    },
    otpExpiresAt: {
      type: Date,
      default: undefined,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    resetOtpHash: {
      type: String,
      default: undefined,
    },
    resetOtpExpiresAt: {
      type: Date,
      default: undefined,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
