import express from "express";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Vote on Poll: POST /api/polls/vote
router.post("/vote", auth, async (req, res) => {
  try {
    const { postId, optionIndex } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.type !== "poll") return res.status(400).json({ message: "Not a poll post" });

    const userId = req.user.id;
    if (post.votedBy.includes(userId)) {
      return res.status(400).json({ message: "User has already voted" });
    }

    post.votedBy.push(userId);
    await post.save();
    res.json({ message: "Vote recorded", optionIndex });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;