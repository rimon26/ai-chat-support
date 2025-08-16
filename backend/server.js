import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({});

const PORT = process.env.PORT || 3001;

let knowledge = "";
(async () => {
  knowledge = await fs.readFile("./data/knowledge.txt", "utf8");
})();

import path from "path";

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const { prompt, image, mimeType } = req.body;

  try {
    const parts = [
      {
        text: `
      You are an AI customer support assistant for a digital platform dedicated to budget-conscious travelers.
      Respond professionally, clearly, and concisely.
      -- Here is some info about the company --
      ${knowledge}
      User: ${prompt}
      `,
      },
    ];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg", // fallback to jpeg
          data: image,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
