const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "gender_quiz";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
app.use(express.json());

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key"]
}));

app.use(cors({ origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN.split(",").map(s => s.trim()) }));
app.use(express.json({ limit: "20kb" }));

let resultsCollection;

app.get("/", (_req, res) => res.send("Gender Equality Quiz API is running."));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/results", async (req, res) => {
  try {
    const { score, total, title, seconds, timeUp } = req.body || {};
    if (!Number.isInteger(score) || score < 0 || score > 30 || total !== 30 ||
        typeof title !== "string" || title.length > 100 ||
        !Number.isInteger(seconds) || seconds < 0 || seconds > 1200 ||
        typeof timeUp !== "boolean") {
      return res.status(400).json({ error: "Invalid quiz result." });
    }
    const result = { score, total, title, seconds, timeUp, at: Date.now() };
    const inserted = await resultsCollection.insertOne(result);
    return res.status(201).json({ ok: true, id: inserted.insertedId });
  } catch (err) {
    console.error("Saving result failed:", err);
    return res.status(500).json({ error: "Could not save result." });
  }
});

app.get("/api/results", async (req, res) => {
  if (!ADMIN_KEY || req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid admin key." });
  }
  try {
    const rows = await resultsCollection.find({}, { projection: { _id: 0 } }).sort({ at: -1 }).toArray();
    return res.json(rows);
  } catch (err) {
    console.error("Loading results failed:", err);
    return res.status(500).json({ error: "Could not load results." });
  }
});

async function start() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing. Check your .env file.");
    }

    if (!ADMIN_KEY) {
      throw new Error("ADMIN_KEY is missing. Check your .env file.");
    }

    console.log("Connecting to MongoDB...");

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    console.log("MongoDB connected successfully!");

    const db = client.db(DB_NAME);
    resultsCollection = db.collection("results");

    await resultsCollection.createIndex({ at: -1 });

    console.log(`Using database: ${DB_NAME}`);
    console.log("Starting API server...");

    app.listen(PORT, () => {
      console.log(`Quiz API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}
start().catch(err => { console.error(err); process.exit(1); });
