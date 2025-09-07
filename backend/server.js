const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/couplejournal",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Create User model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  email: { type: String }, // Keep email but don't make it required
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Create a sparse unique index for email to allow null values
UserSchema.index({ email: 1 }, { sparse: true, unique: true });

const User = mongoose.model("User", UserSchema);

// Create Journal Entry model
const JournalEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["text", "image", "video", "voice"],
    required: true,
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const JournalEntry = mongoose.model("JournalEntry", JournalEntrySchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images, videos, and audio files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter,
});

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Token is not valid." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate." });
  }
};

// Routes

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, displayName, email } = req.body;

    if (!username || !password || !displayName) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check for existing email only if provided
    if (email && email.trim() !== "") {
      const existingEmail = await User.findOne({ email: email.trim() });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      username,
      password: hashedPassword,
      displayName,
      email: email && email.trim() !== "" ? email.trim() : undefined, // Only set if provided
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      if (error.keyPattern && error.keyPattern.username) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Please provide username and password" });
    }

    // Try to find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }, // Also try to match by email
      ],
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid login credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid login credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create journal entry endpoint
app.post("/api/entries", auth, upload.single("file"), async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    let finalContent = content;

    if (req.file) {
      finalContent = `/uploads/${req.file.filename}`;
    } else if (type !== "text" && !req.file) {
      return res
        .status(400)
        .json({ error: "File is required for this entry type" });
    }

    const entry = new JournalEntry({
      userId: req.user._id,
      type,
      content: finalContent,
    });

    await entry.save();
    await entry.populate("userId", "username displayName");

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all entries endpoint
app.get("/api/entries", auth, async (req, res) => {
  try {
    const entries = await JournalEntry.find()
      .populate("userId", "username displayName")
      .populate("comments.userId", "displayName")
      .sort({ timestamp: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like an entry endpoint
app.post("/api/entries/:id/like", auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const alreadyLiked = entry.likes.includes(req.user._id);

    if (alreadyLiked) {
      entry.likes = entry.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      entry.likes.push(req.user._id);
    }

    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment endpoint
app.post("/api/entries/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    entry.comments.push({
      userId: req.user._id,
      text: text.trim(),
    });

    await entry.save();
    await entry.populate("comments.userId", "displayName");

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete entry endpoint
app.delete("/api/entries/:id", auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Check if the user owns this entry
    if (entry.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this entry" });
    }

    // Delete associated file if exists
    if (entry.type !== "text" && entry.content) {
      const filePath = path.join(__dirname, entry.content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await JournalEntry.findByIdAndDelete(req.params.id);
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment endpoint
app.delete(
  "/api/entries/:entryId/comments/:commentId",
  auth,
  async (req, res) => {
    try {
      const { entryId, commentId } = req.params;
      const entry = await JournalEntry.findById(entryId);

      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      // Find the comment index
      const commentIndex = entry.comments.findIndex(
        (comment) => comment._id.toString() === commentId
      );

      if (commentIndex === -1) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const comment = entry.comments[commentIndex];

      // Check if the user owns this comment or the entry
      if (
        comment.userId.toString() !== req.user._id.toString() &&
        entry.userId.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this comment" });
      }

      // Remove the comment
      entry.comments.splice(commentIndex, 1);
      await entry.save();

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get current user info endpoint
app.get("/api/user", auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
  }
  res.status(500).json({ error: error.message });
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`💖 CoupleJournal server is running on port ${PORT}`);
});
