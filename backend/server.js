const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------- Middleware ----------------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- MongoDB Connection ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ---------------- Upload Folder ----------------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ---------------- Multer Config ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // Allow images and videos only
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"));
    }
  },
});

// ---------------- MongoDB Models ----------------

// Member Schema
const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, default: "" },
    birth_date: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar_url: { type: String, default: null },
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);

// Memory Schema
const memorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, default: "" },
    location: { type: String, default: "" },
    file_url: { type: String, default: null },
    file_type: { type: String, default: null }, // "image" or "video"
    tags: { type: [String], default: [] },
    member_ids: { type: [String], default: [] },
    // AI fields
    aiDescription: { type: String, default: "" },
    aiTags: { type: [String], default: [] },
    emotions: { type: [String], default: [] },
    occasion: { type: String, default: "" },
  },
  { timestamps: true }
);

const Memory = mongoose.model("Memory", memorySchema);

// ================================================================
//  MEMBERS API
// ================================================================

// GET all members
app.get("/api/members", async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single member + their memories
app.get("/api/members/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    // Also fetch memories that include this member
    const memories = await Memory.find({
      member_ids: req.params.id,
    }).sort({ date: -1 });

    res.json({ member, memories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST — Add new member (with optional avatar upload)
// FIX: upload.single("avatar") correctly handles the "avatar" field from FormData
app.post("/api/members", upload.single("avatar"), async (req, res) => {
  try {
    const { name, relation, birth_date, bio } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    // FIX: Build the full avatar URL correctly
    // req.file.filename is just the filename e.g. "1234567890-abc.jpg"
    // We store the path as "/uploads/filename" — frontend prefixes with backend base URL
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;

    const member = await Member.create({
      name: name.trim(),
      relation: relation || "",
      birth_date: birth_date || "",
      bio: bio || "",
      avatar_url,
    });

    res.status(201).json(member);
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT — Update member (with optional new avatar)
// FIX: This route was completely MISSING — added it here
app.put("/api/members/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { name, relation, birth_date, bio } = req.body;

    const existing = await Member.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Member not found" });

    // If a new avatar is uploaded, delete the old file from disk
    if (req.file && existing.avatar_url) {
      const oldFilePath = path.join(__dirname, existing.avatar_url);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath); // Delete old avatar file
      }
    }

    const updatedData = {
      name: name ? name.trim() : existing.name,
      relation: relation !== undefined ? relation : existing.relation,
      birth_date: birth_date !== undefined ? birth_date : existing.birth_date,
      bio: bio !== undefined ? bio : existing.bio,
    };

    // Only update avatar_url if a new file was uploaded
    if (req.file) {
      updatedData.avatar_url = `/uploads/${req.file.filename}`;
    }

    const updated = await Member.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true } // Return the updated document
    );

    res.json(updated);
  } catch (error) {
    console.error("Update member error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE member (also deletes their avatar file from disk)
app.delete("/api/members/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    // Delete the avatar image file from disk if it exists
    if (member.avatar_url) {
      const filePath = path.join(__dirname, member.avatar_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
//  MEMORIES API
// ================================================================

// GET all memories
app.get("/api/memories", async (req, res) => {
  try {
    const { member_id, tag, occasion } = req.query;
    let filter = {};

    if (member_id) filter.member_ids = member_id;
    if (tag) filter.tags = { $in: [tag] };
    if (occasion) filter.occasion = occasion;

    const memories = await Memory.find(filter).sort({ date: -1 });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single memory
app.get("/api/memories/:id", async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ error: "Memory not found" });
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST — Add new memory
app.post("/api/memories", upload.single("file"), async (req, res) => {
  try {
    const { title, description, date, location, tags, member_ids } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const file_type = req.file
      ? req.file.mimetype.startsWith("video")
        ? "video"
        : "image"
      : null;

    // Parse tags and member_ids safely (they come as JSON strings from FormData)
    let parsedTags = [];
    let parsedMemberIds = [];

    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch {
      parsedTags = tags ? [tags] : [];
    }

    try {
      parsedMemberIds = member_ids ? JSON.parse(member_ids) : [];
    } catch {
      parsedMemberIds = member_ids ? [member_ids] : [];
    }

    // Mock AI result (replace with real Claude API call if needed)
    const aiResult = {
      description: `A wonderful family memory titled "${title}"`,
      tags: ["family", "memories", ...parsedTags],
      emotions: ["happy", "nostalgic"],
      occasion: "family event",
    };

    const memory = await Memory.create({
      title: title.trim(),
      description: description || "",
      date: date || "",
      location: location || "",
      file_url,
      file_type,
      tags: parsedTags,
      member_ids: parsedMemberIds,
      aiDescription: aiResult.description,
      aiTags: aiResult.tags,
      emotions: aiResult.emotions,
      occasion: aiResult.occasion,
    });

    res.status(201).json(memory);
  } catch (error) {
    console.error("Add memory error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT — Update memory
app.put("/api/memories/:id", upload.single("file"), async (req, res) => {
  try {
    const { title, description, date, location, tags, member_ids } = req.body;

    const existing = await Memory.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Memory not found" });

    // Delete old file if new one is uploaded
    if (req.file && existing.file_url) {
      const oldPath = path.join(__dirname, existing.file_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    let parsedTags = existing.tags;
    let parsedMemberIds = existing.member_ids;

    try { if (tags) parsedTags = JSON.parse(tags); } catch { parsedTags = [tags]; }
    try { if (member_ids) parsedMemberIds = JSON.parse(member_ids); } catch { parsedMemberIds = [member_ids]; }

    const updatedData = {
      title: title ? title.trim() : existing.title,
      description: description !== undefined ? description : existing.description,
      date: date !== undefined ? date : existing.date,
      location: location !== undefined ? location : existing.location,
      tags: parsedTags,
      member_ids: parsedMemberIds,
    };

    if (req.file) {
      updatedData.file_url = `/uploads/${req.file.filename}`;
      updatedData.file_type = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const updated = await Memory.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE memory (also deletes the file from disk)
app.delete("/api/memories/:id", async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ error: "Memory not found" });

    if (memory.file_url) {
      const filePath = path.join(__dirname, memory.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Memory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Memory deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
//  STATS API
// ================================================================
app.get("/api/stats", async (req, res) => {
  try {
    const totalMemories = await Memory.countDocuments();
    const totalMembers = await Member.countDocuments();
    const recentMemories = await Memory.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title file_url date occasion");

    res.json({ totalMemories, totalMembers, recentMemories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
//  ROOT
// ================================================================
app.get("/", (req, res) => {
  res.send("📸 Family Memory API is running successfully 🚀");
});

// Global error handler for multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 100MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`✅ Family Memory API running at http://localhost:${PORT}`);
});