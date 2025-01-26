import express, { Request, Response, Express } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { db } from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT || 4444;

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

app.post(
  "/api/contents",
  upload.single("contentPath"),
  async (req: MulterRequest, res: Response) => {
    try {
      const { id, pk, nullifier, ic, title, description, price, category } =
        req.body;

      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const fileName = req.file.filename;
      const relativePath = `uploads/${fileName}`;

      // Insert into DB
      await db.query(
        `INSERT INTO contents (id, ic, title, description, price, category, contentPath)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, ic, title, description, price, category, relativePath]
      );

      res.status(201).json({ message: "Content uploaded successfully" });
    } catch (error) {
      console.error("Error uploading content:", error);
      res.status(500).json({ error: "Failed to upload content." });
    }
  }
);

// POST /api/purchases
app.post("/api/purchases", async (req, res) => {
  try {
    const { user_pk, content_id } = req.body;
    if (!user_pk || !content_id) {
      res.status(400).json({ error: "Missing user_pk or content_id" });
    }

    // (Optionally) check if the user already purchased it
    const [existing] = await db.query(
      `SELECT purchase_id FROM purchases WHERE user_pk = ? AND content_id = ?`,
      [user_pk, content_id]
    );
    if ((existing as any[]).length > 0) {
      res.status(400).json({ error: "Content already purchased" });
    }

    await db.query(
      `INSERT INTO purchases (user_pk, content_id) VALUES (?, ?)`,
      [user_pk, content_id]
    );

    res.json({ message: "Purchase successful" });
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ error: "Failed to purchase content" });
  }
});

// POST /api/register

app.post("/api/register", async (req, res) => {
  try {
    const { privateKey, nullifier, identityCommitment } = req.body;
    // For now, you might just log these or save them in a "creators" table
    console.log("Registering creator:", {
      privateKey,
      nullifier,
      identityCommitment,
    });

    await db.query(
      `INSERT INTO creators (privateKey, nullifier, identityCommitment) VALUES (?, ?, ?)`,
      [privateKey, nullifier, identityCommitment]
    );

    res.json({ message: "Registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Failed to register." });
  }
});

// GET /api/contents/bycreator/:creatorId
app.get("/api/contents/bycreator/:creatorId", async (req, res) => {
  try {
    const { creatorId } = req.params;

    const [rows] = await db.query(
      "SELECT id, title, description, category, price FROM contents WHERE ic = ?",
      [creatorId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching creator contents:", error);
    res.status(500).json({ error: "Failed to fetch contents." });
  }
});

// GET /api/purchases/user/:userPk
app.get("/api/purchases/user/:userPk", async (req, res) => {
  try {
    const { userPk } = req.params;

    const [rows] = await db.query(
      `SELECT c.id, c.title, c.description, c.category, c.price, c.contentPath, p.purchase_date
         FROM purchases p
         JOIN contents c ON p.content_id = c.id
         WHERE p.user_pk = ?`,
      [userPk]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases." });
  }
});

app.use("/contents", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
