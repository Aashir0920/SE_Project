import express from "express";
import Subscription from "../models/Subscription.js";
import Tier from "../models/Tier.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Subscribe to Tier: POST /api/subscription
router.post("/", auth, async (req, res) => {
  try {
    const { tierId } = req.body;
    const tier = await Tier.findById(tierId);
    if (!tier) return res.status(404).json({ message: "Tier not found" });

    const existingSubscription = await Subscription.findOne({
      subscriberId: req.user.id,
      "tierId.creatorId": tier.creatorId,
    });
    if (existingSubscription) {
      return res.status(400).json({ message: "Already subscribed to this creator" });
    }

    const subscription = new Subscription({
      subscriberId: req.user.id,
      tierId,
      status: "active",
      startDate: new Date(),
    });
    await subscription.save();
    res.status(201).json({ message: "Subscribed to tier", subscription });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get User Subscriptions: GET /api/subscription
router.get("/", auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ subscriberId: req.user.id }).populate({
      path: "tierId",
      populate: { path: "creatorId" },
    });
    res.json({ subscriptions });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel Subscription: POST /api/subscription/cancel
router.post("/cancel", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ subscriberId: req.user.id, status: "active" });
    if (!subscription) return res.status(404).json({ message: "No active subscription found" });

    subscription.status = "canceled";
    subscription.endDate = new Date();
    await subscription.save();
    res.json({ message: "Subscription canceled" });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;