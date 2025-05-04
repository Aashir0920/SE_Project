import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Tier from "../models/Tier.js";
import Subscription from "../models/Subscription.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs"; // Import fs for directory creation
import { fileURLToPath } from 'url';
import mongoose from "mongoose";


const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Multer storage configuration for profile pictures
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


// Get User Profile: GET /api/user/profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -twoFactorSecret");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ profile: user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get User's Own Posts: GET /api/user/posts
router.get("/posts", auth, async (req, res) => {
  try {
    const posts = await Post.find({ creatorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update User Profile: POST /api/user/update-profile
router.post("/update-profile", auth, async (req, res) => {
  try {
    const { bio, socialLinks } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { bio, socialLinks: socialLinks ? socialLinks.split(',').map(link => link.trim()) : [] },
      { new: true, runValidators: true }
    ).select("-password -twoFactorSecret");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", profile: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Server error" });
  }
});


// Upload Profile Picture: POST /api/user/profile-pic
router.post("/profile-pic", auth, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePicUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicUrl },
      { new: true, runValidators: true }
    ).select("-password -twoFactorSecret");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile picture updated successfully", profilePic: user.profilePic });

  } catch (err) {
    console.error("Profile pic upload error:", err);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
      }
    res.status(500).json({ message: "Server error" });
  }
});

// Get Creator Profile (for viewing other users' profiles): GET /api/user/:creatorId/profile
router.get("/:creatorId/profile", auth, async (req, res) => {
  try {
     if (!isValidObjectId(req.params.creatorId)) {
         return res.status(400).json({ message: "Invalid creator ID format" });
     }
    const user = await User.findById(req.params.creatorId).select("-password -twoFactorSecret");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ profile: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Creator Posts (for viewing other users' posts): GET /api/user/:creatorId/posts
router.get("/:creatorId/posts", auth, async (req, res) => {
  try {
     if (!isValidObjectId(req.params.creatorId)) {
         return res.status(400).json({ message: "Invalid creator ID format" });
     }
    const posts = await Post.find({ creatorId: req.params.creatorId }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get Creator Tiers: GET /api/user/:creatorId/tiers (Marked as potentially redundant in previous step)
router.get("/:creatorId/tiers", auth, (req, res) => {
    console.log("Accessed /api/user/:creatorId/tiers - Consider using /api/tiers/:creatorId directly");
    res.status(501).json({ message: "This route is not fully implemented or may be redundant. Use /api/tiers/:creatorId" });
});


// Get Subscription Status to a Specific Creator: GET /api/user/:creatorId/subscription-status
router.get("/:creatorId/subscription-status", auth, async (req, res) => {
  try {
     if (!isValidObjectId(req.params.creatorId)) {
         return res.status(400).json({ message: "Invalid creator ID format" });
     }
    const subscription = await Subscription.findOne({
      subscriberId: req.user.id,
      status: "active",
    }).populate('tierId');

    const isSubscribed = subscription && subscription.tierId && subscription.tierId.creatorId.toString() === req.params.creatorId.toString();

    res.json({ isSubscribed: !!isSubscribed });
  } catch (error) {
    console.error("Get creator subscription status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Search Users (by Email): GET /api/user?email=...
router.get("/", auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email query parameter is required" });
    }
    const users = await User.find(
        { email: { $regex: email, $options: 'i' } },
        'name email profilePic' // Also include profilePic for search results display
    ).limit(10);

    res.json({ users });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Recent Activity for Dashboard: GET /api/user/activity
// Protected route, requires authentication
router.get("/activity", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const recentThreshold = new Date(now.setDate(now.getDate() - 30)); // Activity in the last 30 days

    const activity = [];

    // 1. Fetch recent subscriptions to the creator's tiers
    // Use aggregation to join Subscriptions with Tiers and filter by creatorId
    const recentSubscriptions = await Subscription.aggregate([
        {
            $match: { // Initial filter on Subscription collection
                status: "active",
                startDate: { $gte: recentThreshold },
            }
        },
        {
            $lookup: { // Join with Tier collection
                from: 'tiers', // The collection name (usually lowercase plural of model name)
                localField: 'tierId',
                foreignField: '_id',
                as: 'tier' // Output array field name
            }
        },
        {
            $unwind: '$tier' // Deconstruct the tier array (assuming one tier per subscription)
        },
        {
            $match: { // Filter based on the joined tier's creatorId
                'tier.creatorId': new mongoose.Types.ObjectId(userId) // Use ObjectId for matching
            }
        },
        {
            $lookup: { // Join with User collection for subscriber info
                from: 'users',
                localField: 'subscriberId',
                foreignField: '_id',
                as: 'subscriber'
            }
        },
        { $unwind: '$subscriber' } // Deconstruct the subscriber array
    ]);


    // 2. Fetch recent comments on the creator's posts
     // Find posts created by the user that have comments within the recent threshold
    const postsWithRecentComments = await Post.find({
        creatorId: userId,
        'comments.createdAt': { $gte: recentThreshold } // Filter posts that have at least one comment within the threshold
    }).select('content.text comments creatorName') // Select necessary fields
      .populate('comments.userId', 'name profilePic') // Attempt to populate commenter user info (requires adjusting comment schema if userId is string)
      .lean();


     postsWithRecentComments.forEach(post => {
         post.comments.forEach(comment => {
            // Filter comments by timestamp again as the post-level filter is approximate
             if (new Date(comment.createdAt) >= recentThreshold) {
                 // Check if userId is populated (i.e., if it was an ObjectId)
                 // In the aggregation above, subscriber is populated. Here for comments, userId is populated by Mongoose .populate
                 // Ensure comment.userId is checked before accessing properties
                 const commenterName = comment.userId?.name || (typeof comment.userId === 'string' ? comment.userId : 'Someone'); // Use optional chaining
                  const commenterPic = comment.userId && typeof comment.userId === 'object' ? comment.userId.profilePic : null;

                 activity.push({
                     type: 'new_comment',
                     description: `${commenterName || 'Someone'} commented on your post \"${post.content.text ? post.content.text.substring(0, 50) + '...' : 'Post'}\"`,
                     timestamp: comment.createdAt,
                     post: {
                         id: post._id,
                         textSnippet: post.content.text ? post.content.text.substring(0, 50) + '...' : 'Post',
                         creatorName: post.creatorName
                     },
                     commenter: {
                         id: comment.userId?._id || comment.userId, // Use optional chaining
                         name: commenterName,
                         profilePic: commenterPic
                     }
                 });
             }
         });
     });


    // Add recent subscriptions from aggregation results to the activity array
    recentSubscriptions.forEach(sub => {
        activity.push({
             type: 'new_subscription',
             description: `${sub.subscriber.name || 'Someone'} subscribed to your tier "${sub.tier.name}"!`, // Use populated subscriber/tier names
             timestamp: sub.startDate,
             subscriber: { id: sub.subscriber._id, name: sub.subscriber.name, profilePic: sub.subscriber.profilePic },
             tier: { id: sub.tier._id, name: sub.tier.name }
        });
    });


     // Sort all activity (comments and subscriptions) by timestamp descending
    activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

     // Limit results
    const limitedActivity = activity.slice(0, 20); // Limit to the 20 most recent activities


    // Send the single, final response
    res.json({ activity: limitedActivity });

  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



export default router;