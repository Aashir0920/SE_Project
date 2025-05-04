import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creatorName: { type: String, required: true },
  content: {
    text: { type: String },
    media: [
      {
        type: { type: String, enum: ["image", "video"] },
        url: { type: String },
        filename: { type: String },
      },
    ],
    options: [{ text: { type: String } }],
  },
  type: { type: String, enum: ["text", "media", "poll", "fundraiser"], required: true },
  exclusive: { type: Boolean, default: false },
  fundingGoal: { type: Number },
  currentAmount: { type: Number, default: 0 },
  goalDeadline: { type: Date },
  taggedUsers: [{ type: String }],
  scheduleTime: { type: Date },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  votedBy: [{ type: String }],
  comments: [
    {
      userId: { type: String },
      text: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post", postSchema);