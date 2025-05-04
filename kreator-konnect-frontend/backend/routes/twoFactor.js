import express from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Placeholder for generating a 6-digit code
const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get 2FA Status: GET /api/2fa/status
router.get("/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("twoFactorEnabled");
    res.json({ isTwoFactorEnabled: user.twoFactorEnabled });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send 2FA Code: POST /api/2fa/send-code
router.post("/send-code", auth, async (req, res) => {
  try {
    const code = generate2FACode();
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { twoFactorSecret: code },
      { new: true }
    );
    // FUTURE: Integrate with email/SMS service (e.g., SendGrid, Twilio)
    console.log(`2FA Code for user ${user.email}: ${code}`); // Placeholder for sending code
    res.json({ message: "Verification code sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify 2FA Code: POST /api/2fa/verify
router.post("/verify", auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (user.twoFactorSecret !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    await User.findByIdAndUpdate(
      req.user.id,
      { twoFactorEnabled: true, twoFactorSecret: "" },
      { new: true }
    );
    res.json({ message: "2FA enabled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Disable 2FA: POST /api/2fa/disable
router.post("/disable", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { twoFactorEnabled: false, twoFactorSecret: "" },
      { new: true }
    );
    res.json({ message: "2FA disabled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;