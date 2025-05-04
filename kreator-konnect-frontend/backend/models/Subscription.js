import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier", required: true },
  status: { type: String, enum: ["active", "canceled"], default: "active" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
});

export default mongoose.model("Subscription", subscriptionSchema);