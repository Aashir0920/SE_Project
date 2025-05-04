import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  requestDate: { type: Date, required: true },
  processedDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payout", payoutSchema);