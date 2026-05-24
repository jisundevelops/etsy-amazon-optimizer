export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { productName, category, features, audience, price, platform, model } = req.body;

    if (!productName || !features) {
      return res.status(400).json({ error: "Product name and Key features are required." });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable in Vercel." });
    }

    const MODEL_MAP = {
      "deepseek-v4-flash": "deepseek/deepseek-chat-v3-0324:free",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct:free",
      "qwen3-32b": "qwen/qwen3-32b:free"
    };

    const selectedModel = MODEL_MAP[model] || MODEL_MAP["deepseek-v4-flash"];

    const systemPrompt = `You are an expert Etsy and Amazon SEO specialist. Generate optimized product listings that rank high in search.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "title": "optimized title here",
  "description": "SEO description here",
  "tags": ["tag1", "tag2", ...]
}

Rules:
- title: keyword-rich, strictly under 140 characters, optimized for search ranking
- description: sales-driven, professional, SEO-focused, 150-200 words, include relevant keywords naturally
- tags: exactly 13 tags, each under 20 characters, optimized for search engines and buyer queries`;

    const userPrompt = `Generate an optimized listing for:
Product: ${productName}
Category: ${category || "Other"}
Features: ${features}
Audience: ${audience || "general buyers"}
Price: ${price || "N/A"}
Platform: ${platform || "Both"}

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://etsy-amazon-optimizer.vercel.app",
        "X-Title": "Etsy & Amazon Listing Optimizer"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `OpenRouter API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response received from AI model.");
    }

    const jsonResponse = JSON.parse(content.trim());

    if (!jsonResponse.title || !jsonResponse.description || !jsonResponse.tags) {
      throw new Error("Invalid response format from AI model.");
    }

    return res.status(200).json({
      ...jsonResponse,
      model: model
    });
  } catch (error) {
    console.error("Error generating listing:", error);
    return res.status(500).json({ error: error.message || "An error occurred during listing generation." });
  }
}
