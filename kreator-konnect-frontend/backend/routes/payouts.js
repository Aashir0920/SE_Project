import express from "express";
import Payout from "../models/Payout.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Request Payout: POST /api/payouts
router.post("/", auth, async (req, res) => {
  try {
    const { amount, paymentMethod, details } = req.body;
    const payout = new Payout({
      creatorId: req.user.id,
      amount,
      paymentMethod,
      status: "pending",
      requestDate: new Date(),
    });
    await payout.save();
    res.status(201).json({ message: "Payout requested", payout });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Creator Payouts: GET /api/payouts
router.get("/", auth, async (req, res) => {
  try {
    const payouts = await Payout.find({ creatorId: req.user.id }).sort({ requestDate: -1 });
    res.json({ payouts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Payout History: GET /api/payouts/history
router.get("/history", auth, async (req, res) => {
  try {
    const payouts = await Payout.find({ creatorId: req.user.id }).sort({ requestDate: -1 });
    res.json({ 
      payouts: payouts.map(payout => ({
        _id: payout._id,
        amount: payout.amount,
        method: payout.paymentMethod,
        status: payout.status,
        date: payout.requestDate,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;