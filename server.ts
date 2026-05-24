import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - POST /api/generate
  app.post("/api/generate", async (req, res) => {
    try {
      const { productName, category, features, audience, price, platform } = req.body;

      if (!productName || !features) {
        return res.status(400).json({ error: "Product name and Key features are required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured. Please check your AI Studio secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Generate an optimized listing for:
Product: ${productName}
Category: ${category || "Other"}
Features: ${features}
Audience: ${audience || "general buyers"}
Price: ${price || "N/A"}
Platform: ${platform || "Both"}

Return ONLY valid JSON matching the schema requirements. Ensure:
1. Title is under 140 characters, keyword-rich, and optimized for search.
2. Description is compelling, professional, SEO-focused, and 150-200 words.
3. Tags includes exactly 13 tags, each under 20 characters, optimized for search engines.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert Etsy and Amazon SEO specialist. Generate optimized product listings that rank high in search.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Optimized keyword-rich listing title, strictly under 140 characters."
              },
              description: {
                type: Type.STRING,
                description: "Sales-driven SEO description, containing 150 to 200 words."
              },
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Exactly 13 tags, optimized for SEO search queries, each strictly under 20 characters."
              }
            },
            required: ["title", "description", "tags"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response received from Gemini model.");
      }

      // Safe JSON parsing of schema forced output
      const jsonResponse = JSON.parse(resultText.trim());
      return res.json(jsonResponse);
    } catch (error: any) {
      console.error("Error generating listing:", error);
      return res.status(500).json({ error: error.message || "An error occurred during listing generation." });
    }
  });

  // Vite integration and static asset hosting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
