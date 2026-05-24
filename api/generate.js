import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { productName, category, features, audience, price, platform } = req.body;

    if (!productName || !features) {
      return res.status(400).json({ error: "Product name and Key features are required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY environment variable in Vercel." });
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
  } catch (error) {
    console.error("Error generating listing:", error);
    return res.status(500).json({ error: error.message || "An error occurred during listing generation." });
  }
}
