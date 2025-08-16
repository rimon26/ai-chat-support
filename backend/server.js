import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";

let knowledge = "";

// Preload knowledge base file once
(async () => {
  try {
    knowledge = await fs.readFile("./data/knowledge.txt", "utf8");
    console.log("✅ Knowledge base loaded");
  } catch (err) {
    console.warn("⚠️ Could not load knowledge.txt:", err.message);
  }
})();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, image, mimeType } = req.body;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

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
          mimeType: mimeType || "image/jpeg",
          data: image,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
    });

    const reply =
      response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No reply";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Error in /api/chat:", error);
    res.status(500).json({ error: error.message });
  }
}
