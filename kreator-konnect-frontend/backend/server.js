import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
// import errorHandler from "./middleware/error.js"; // Error handler is commented out/not used
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import tierRoutes from "./routes/tiers.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import messageRoutes from "./routes/messages.js";
import payoutRoutes from "./routes/payouts.js";
import exclusiveContentRoutes from "./routes/exclusiveContent.js";
import twoFactorRoutes from "./routes/twoFactor.js";
import metricRoutes from "./routes/metrics.js";
import pollsRoutes from "./routes/polls.js";
import path from "path";
import { fileURLToPath } from "url"; // Needed if using __dirname with ES modules

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

console.log("UPLOADS_DIR from .env:", process.env.UPLOADS_DIR); // Log the value


const app = express();

// Connect to MongoDB
connectDB();

// Middleware
// Configure CORS for your frontend origin
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// Serve static files from the 'uploads' directory
// Ensure the directory exists in your backend root
app.use("/uploads", express.static(path.join(__dirname, process.env.UPLOADS_DIR || "uploads"))); // Use __dirname for robust path


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tiers", tierRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/polls", pollsRoutes);
app.use("/api", exclusiveContentRoutes); // Note: This might conflict with other routes if not careful
app.use("/api/2fa", twoFactorRoutes);
app.use("/api", metricRoutes); // Note: This might conflict with other routes if not careful


// Simple root route
app.get('/', (req, res) => {
  res.send('API is running...');
});


// Log registered routes for debugging
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`Registered route: ${Object.keys(r.route.methods).map(method => method.toUpperCase()).join(', ')} ${r.route.path}`);
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});