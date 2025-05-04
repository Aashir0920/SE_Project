import express from "express";
import Subscription from "../models/Subscription.js";
import Payout from "../models/Payout.js";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get Monthly Earnings: GET /api/earnings/monthly
router.get("/earnings/monthly", auth, async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const subscriptions = await Subscription.find({
      status: "active",
      startDate: { $gte: startOfMonth },
    }).populate("tierId");
    const earnings = subscriptions.reduce((sum, sub) => sum + (sub.tierId.price || 0), 0);
    const payouts = await Payout.find({
      creatorId: req.user.id,
      requestDate: { $gte: startOfMonth },
      status: "completed",
    });
    const paidOut = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    res.json({ earnings: earnings - paidOut });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Subscriber Count: GET /api/subscribers/count
router.get("/subscribers/count", auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ "tierId.creatorId": req.user.id, status: "active" });
    res.json({ count: subscriptions.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Engagement Metrics: GET /api/posts/metrics
router.get("/posts/metrics", auth, async (req, res) => {
  try {
    const posts = await Post.find({ creatorId: req.user.id });
    const metrics = posts.reduce(
      (acc, post) => ({
        views: acc.views + (post.views || 0),
        likes: acc.likes + (post.likes || 0),
        comments: acc.comments + (post.comments ? post.comments.length : 0),
      }),
      { views: 0, likes: 0, comments: 0 }
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;