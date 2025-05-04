import express from "express";
import Tier from "../models/Tier.js";
import auth from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get Tiers by Creator: GET /api/tiers/:creatorId
router.get("/:creatorId", auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.creatorId)) {
      return res.status(400).json({ message: "Invalid creator ID format" });
    }
    const tiers = await Tier.find({ creatorId: req.params.creatorId });
    res.json({ tiers });
  } catch (err) {
    console.error("Get tiers by creator error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create Tier: POST /api/tiers
router.post("/", auth, async (req, res) => {
  try {
    const { name, price, benefits } = req.body;

    if (!name || price === undefined || price < 0 || !benefits || !Array.isArray(benefits)) {
      return res.status(400).json({ message: "Valid name, price (non-negative), and benefits (as an array) are required." });
    }

    const tier = new Tier({
      creatorId: req.user.id,
      name,
      price,
      benefits,
    });

    await tier.save();
    res.status(201).json({ message: "Tier created successfully", tier });
  } catch (err) {
    console.error("Create tier error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Logged-in User's Tiers: GET /api/tiers/me
router.get("/me", auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    const tiers = await Tier.find({ creatorId: req.user.id }).sort({ price: 1 });
    res.json({ tiers });
  } catch (err) {
    console.error("Get logged-in user's tiers error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;