import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: {
    text: { type: String }, // Optional text content
    attachmentUrl: { type: String }, // Optional attachment URL
    attachmentType: { type: String, enum: ['image', 'video', 'file'] } // Type of attachment
  }, // Content is now an object, either text OR attachment fields required
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);