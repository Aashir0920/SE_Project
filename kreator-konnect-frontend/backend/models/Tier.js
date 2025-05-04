import mongoose from "mongoose";

const tierSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  benefits: [{ type: String }],
});

export default mongoose.model("Tier", tierSchema);