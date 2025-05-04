import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js"; // Import User model to populate sender/recipient info
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs"; // Import fs for directory creation
import { fileURLToPath } from 'url'; // Import fileURLToPath for ES modules
import mongoose from "mongoose";

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage configuration for message attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', process.env.UPLOADS_DIR || "uploads/"); // Go up one level to backend root
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// Upload Message Attachment: POST /api/messages/upload
// Protected route, requires authentication, uses multer for single file upload
router.post("/upload", auth, upload.single("attachment"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileMimetype = req.file.mimetype;
    let attachmentType = "file"; // Default to generic file

    if (fileMimetype.startsWith("image/")) {
      attachmentType = "image";
    } else if (fileMimetype.startsWith("video/")) {
      attachmentType = "video";
    }

    // The URL to return is relative to the static served directory
    const attachmentUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: "File uploaded successfully",
      attachment: {
        url: attachmentUrl,
        type: attachmentType,
        filename: req.file.originalname, // Original filename
      },
    });

  } catch (err) {
    console.error("Message attachment upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// Send Message: POST /api/messages
// Protected route, requires authentication
router.post("/", auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body; // content is now an object { text, attachmentUrl, attachmentType }

    if (!isValidObjectId(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient ID format" });
    }

    // Validate content - must have text or an attachment
    if (!content || (!content.text && !content.attachmentUrl)) {
         return res.status(400).json({ message: "Message content (text or attachment) is required" });
    }
     // If attachment is provided, ensure type is also provided
     if (content.attachmentUrl && !content.attachmentType) {
          return res.status(400).json({ message: "Attachment type is required when providing attachment URL" });
     }
      // If attachment type is provided, ensure URL is also provided
      if (content.attachmentType && !content.attachmentUrl) {
           return res.status(400).json({ message: "Attachment URL is required when providing attachment type" });
      }


    // Optional: Check if recipient exists
     const recipient = await User.findById(recipientId);
     if (!recipient) {
         return res.status(404).json({ message: "Recipient not found" });
     }


    const message = new Message({
      senderId: req.user.id, // Sender is the authenticated user
      recipientId: recipientId,
      content: {
        text: content.text,
        attachmentUrl: content.attachmentUrl,
        attachmentType: content.attachmentType,
      },
      timestamp: new Date(),
    });

    await message.save();

    // Optionally populate sender/recipient info before sending back
    const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name profilePic') // Populate sender's name and profilePic
        .populate('recipientId', 'name profilePic'); // Populate recipient's name and profilePic


    res.status(201).json({ message: "Message sent", message: populatedMessage });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Messages for Conversation: GET /api/messages/:conversationId
// Conversation ID format: senderId-recipientId or recipientId-senderId
router.get("/:conversationId", auth, async (req, res) => {
  try {
    const [id1, id2] = req.params.conversationId.split("-");

     if (!isValidObjectId(id1) || !isValidObjectId(id2)) {
         return res.status(400).json({ message: "Invalid conversation ID format" });
     }

     // Ensure the logged-in user is one of the participants in the conversation ID
     if (req.user.id.toString() !== id1.toString() && req.user.id.toString() !== id2.toString()) {
         return res.status(403).json({ message: "You are not authorized to view this conversation" });
     }


    // Find messages between these two users, regardless of who is sender/recipient
    const messages = await Message.find({
      $or: [
        { senderId: id1, recipientId: id2 },
        { senderId: id2, recipientId: id1 },
      ],
    })
    .sort({ timestamp: 1 }) // Sort by timestamp ascending
    .populate('senderId', 'name profilePic') // Populate sender info
    .populate('recipientId', 'name profilePic'); // Populate recipient info (less crucial here as it's a 1-on-1 chat, but good for completeness)


    res.json({ messages });
  } catch (error) {
    console.error("Get messages for conversation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Conversations: GET /api/messages/conversations
// Protected route, requires authentication
router.get("/conversations", auth, async (req, res) => {
  try {
    // Find all messages where the user is either sender or recipient
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    }).sort({ timestamp: -1 }) // Sort by latest message first to easily find the last message
      .populate('senderId', 'name profilePic') // Populate sender info
      .populate('recipientId', 'name profilePic'); // Populate recipient info


    const conversations = [];
    const conversationMap = new Map(); // Use a Map to track unique conversations

    for (const msg of messages) {
      // Determine the other participant's ID
      const otherUserId = msg.senderId._id.toString() === req.user.id.toString()
        ? msg.recipientId._id.toString()
        : msg.senderId._id.toString();

      // Create a unique conversation key (order-independent)
      const conversationKey = [req.user.id.toString(), otherUserId].sort().join('-');

      // If this is the first message found for this conversation key (most recent)
      if (!conversationMap.has(conversationKey)) {
         const otherUser = msg.senderId._id.toString() === req.user.id.toString()
             ? msg.recipientId // The populated recipient object
             : msg.senderId; // The populated sender object

        conversationMap.set(conversationKey, {
          id: conversationKey, // Use the consistent key as the conversation ID
          otherUserId: otherUser._id, // The ID of the other user in the conversation
          otherUserName: otherUser.name,
          otherUserPic: otherUser.profilePic,
          lastMessage: msg.content.text || (msg.content.attachmentType ? `[${msg.content.attachmentType}]` : '[Attachment]'), // Show text or attachment type
          timestamp: msg.timestamp,
        });
      }
    }

     // Convert the Map values back to an array
    conversations.push(...conversationMap.values());

    // Sort conversations by the timestamp of the last message
     conversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());


    res.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


export default router;