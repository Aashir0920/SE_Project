import express from "express";
import Subscription from "../models/Subscription.js";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get Subscription Status: GET /api/user/subscription-status
router.get("/user/subscription-status", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id, status: "active" });
    res.json({ isSubscribed: !!subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Exclusive Content: GET /api/exclusive-content
router.get("/exclusive-content", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id, status: "active" });
    if (!subscription) {
      return res.status(403).json({ message: "No active subscription found" });
    }
    const posts = await Post.find({ exclusive: true, creatorId: subscription.tierId.creatorId }).sort({ createdAt: -1 });
    const content = posts.map(post => ({
      title: post.content.text || "Exclusive Post",
      description: post.content.text || "No description available",
    }));
    res.json({ content });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;