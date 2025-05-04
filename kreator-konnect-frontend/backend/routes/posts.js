import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js"; // Import the Subscription model
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import fs from "fs"; // Import fs for directory creation
import { fileURLToPath } from 'url';

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', process.env.UPLOADS_DIR || "uploads/");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Post: POST /api/posts
router.post("/", auth, upload.array("media"), async (req, res) => {
  try {
    const { text, type, exclusive, fundingGoal, goalDeadline, taggedUsers, options, scheduleTime } = req.body;
    const mediaFiles = req.files
      ? req.files.map((file) => ({
          type: file.mimetype.startsWith("image") ? "image" : file.mimetype.startsWith("video") ? "video" : "file", // Determine type
          url: `/uploads/${file.filename}`,
          filename: file.filename,
        }))
      : [];

    if (!["text", "media", "poll", "fundraiser"].includes(type)) {
      return res.status(400).json({ message: "Invalid post type" });
    }

    if (type === 'text' && !text && mediaFiles.length === 0) { // Text or Media required for text type
        return res.status(400).json({ message: 'Text content or media is required for text posts' });
    }
     if (type === 'media' && mediaFiles.length === 0) {
         return res.status(400).json({ message: 'Media files are required for media posts' });
    }
     if (type === 'poll' && (!options || options.length < 2 || options.some(opt => !opt.text || !opt.text.trim()))) {
         return res.status(400).json({ message: 'At least two options with text are required for poll posts' });
    }
    if (type === 'fundraiser' && (!fundingGoal || isNaN(fundingGoal) || parseFloat(fundingGoal) <= 0)) {
         return res.status(400).json({ message: 'A valid funding goal is required for fundraiser posts' });
    }


    const user = await User.findById(req.user.id).select('name');
    if (!user) {
        return res.status(404).json({ message: 'Creator not found' });
    }


    const post = new Post({
      creatorId: req.user.id,
      creatorName: user.name,
      content: {
        text: text ? text.trim() : '', // Store trimmed text, empty if not provided
        media: mediaFiles,
        options: type === 'poll' && Array.isArray(options) ? options.map(opt => ({ text: opt.text ? opt.text.trim() : '' })) : [], // Ensure options are structured and trimmed
      },
      type,
      exclusive: exclusive || false,
      fundingGoal: type === 'fundraiser' ? parseFloat(fundingGoal) : undefined, // Ensure goal is a number
      goalDeadline: type === 'fundraiser' && goalDeadline ? new Date(goalDeadline) : undefined,
      taggedUsers: taggedUsers && Array.isArray(taggedUsers) ? taggedUsers.filter(id => isValidObjectId(id)) : [], // Validate and store tagged user IDs
      scheduleTime: scheduleTime ? new Date(scheduleTime) : undefined,
      likes: 0,
      likedBy: [],
      votedBy: [],
      comments: [],
      createdAt: new Date(),
    });

    await post.save();

     // Populate creatorName for the response message if needed by frontend
     const populatedPost = await Post.findById(post._id).select('creatorName');

    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Create post error:", error);
     // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Posts by Creator (Used for subscribed feed)
router.get("/creator", auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all active subscriptions for the current user
        const subscriptions = await Subscription.find({ subscriberId: userId, status: 'active' }).populate('tierId');

        // Get the list of creator IDs the user is subscribed to
        const subscribedCreatorIds = subscriptions.map(sub => sub.tierId?.creatorId).filter(id => id); // Use ?. for safety and filter out nulls

        // Include the logged-in user's own ID in the list if you want their posts on the feed too
        // subscribedCreatorIds.push(userId); // Uncomment this line if users should see their own posts on the feed

        // Find posts from these creators
        // Also populate creatorId to get creator's name and profile pic for the feed
        const posts = await Post.find({ creatorId: { $in: subscribedCreatorIds } })
            .sort({ createdAt: -1 })
             .populate('creatorId', 'name profilePic'); // Populate creator's name and profilePic


        res.json({ posts });

    } catch (error) {
        console.error("Get subscribed creator posts error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Get Single Post by ID
router.get("/:id", auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    const post = await Post.findById(req.params.id).populate('creatorId', 'name profilePic'); // Populate creator for single post view
    if (!post) return res.status(404).json({ message: "Post not found" });

     // Check subscription status if the post is exclusive and user is not the creator
     if (post.exclusive && req.user.id.toString() !== post.creatorId._id.toString()) { // Compare populated ID
         const subscription = await Subscription.findOne({
              subscriberId: req.user.id,
              status: 'active',
          }).populate('tierId'); // Populate tierId to check creatorId

         const isSubscribed = subscription && subscription.tierId && subscription.tierId.creatorId.toString() === post.creatorId._id.toString();

         if (!isSubscribed) {
              // Return a 'locked' version of the post
             return res.status(200).json({
                 post: {
                     ...post.toObject(), // Convert Mongoose doc to plain object
                     content: { text: 'Exclusive content. Subscribe to view.' },
                     media: [],
                     options: [],
                     fundingGoal: undefined,
                     currentAmount: undefined,
                     comments: [],
                     isLocked: true // Add a flag for the frontend
                 }
             });
         }
     }

    res.json({ post });
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Like/Unlike Post: POST /api/posts/:id/like
router.post("/:id/like", auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id.toString(); // Ensure consistency with stored IDs

    const hasLiked = post.likedBy.map(id => id.toString()).includes(userId); // Convert stored IDs to string for comparison

    if (hasLiked) {
      // Unlike
      post.likes -= 1;
      post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);
    } else {
      // Like
      post.likes += 1;
      post.likedBy.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes, likedBy: post.likedBy });
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Comment on Post: POST /api/posts/:id/comments
router.post("/:id/comments", auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

     // Ensure the userId in comments is stored as ObjectId if you want to populate it later
     // Based on the original schema, it was a String.
     // If you update the schema, change { type: String } to { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
     // For now, keeping it as String to match the schema, but noting this limitation for population.

    const comment = {
      userId: req.user.id.toString(), // Store user ID as string
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

     // To return the populated comment, you would need to fetch the post again or populate the added comment if schema allows
     // For now, return a simplified comment object. If frontend needs populated user, backend schema/route needs adjustment.
     // Or, frontend can fetch/know the current user's name/pic from local storage.

     // Let's attempt to return a slightly more useful object
     const user = await User.findById(req.user.id).select('name profilePic'); // Fetch sender's info
     const returnedComment = {
         _id: comment._id, // Mongoose adds an _id to subdocuments
         userId: { _id: req.user.id, name: user?.name, profilePic: user?.profilePic }, // Include user info
         text: comment.text,
         createdAt: comment.createdAt,
     };


    res.json({ message: "Comment added", comment: returnedComment }); // Return structured comment
  } catch (err) {
    console.error("Comment post error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Post: DELETE /api/posts/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.creatorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

     // Optional: Delete associated media files from the uploads directory
     // This requires file system access and careful implementation.
     // For now, we'll just remove the post from the database.
     // If needed, add fs.unlink logic here within a loop over post.content.media


    await post.deleteOne();

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;