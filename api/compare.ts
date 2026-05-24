export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { productName, category, features, audience, price, platform } = req.body;

    if (!productName || !features) {
      return res.status(400).json({ error: "Product name and Key features are required." });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenRouter API key is not configured." });
    }

    const MODELS = {
      "deepseek-v4-flash": "deepseek/deepseek-v4-flash:free",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct:free",
      "qwen3-32b": "qwen/qwen3-next-80b-a3b-instruct:free"
    };

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

    // Run all 3 models in parallel
    const modelEntries = Object.entries(MODELS);
    
    const results = await Promise.allSettled(
      modelEntries.map(async ([modelKey, modelId]) => {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://etsy-amazon-optimizer.vercel.app",
            "X-Title": "Etsy & Amazon Listing Optimizer"
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2048
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error?.message || `API error for ${modelKey}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error(`No response from ${modelKey}`);
        }

        // Strip markdown code blocks if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleanContent.trim());

        if (!parsed.title || !parsed.description || !parsed.tags) {
          throw new Error(`Invalid format from ${modelKey}`);
        }

        return { model: modelKey, ...parsed };
      })
    );

    // Collect successful results
    const successfulResults = results
      .map((r, i) => {
        if (r.status === "fulfilled") {
          return r.value;
        }
        return { model: modelEntries[i][0], error: r.reason?.message || "Failed" };
      });

    const validResults = successfulResults.filter(r => !r.error);

    if (validResults.length === 0) {
      throw new Error("All three AI models failed to generate listings. Please try again.");
    }

    // Now use an AI to pick the best one
    const judgeSystemPrompt = `You are an expert SEO judge for Etsy and Amazon product listings. You evaluate listings based on:
1. Title quality: keyword-rich, under 140 chars, compelling for buyers
2. Description quality: professional, SEO-focused, 150-200 words, persuasive
3. Tags quality: exactly 13 tags, each under 20 chars, relevant and high-search-volume keywords
4. Overall SEO effectiveness and buyer appeal

You MUST respond with ONLY valid JSON:
{
  "bestModel": "model-key-here",
  "reason": "brief explanation why this is the best (2-3 sentences)",
  "scores": {
    "model-key-1": { "title": 85, "description": 90, "tags": 88, "overall": 88 },
    "model-key-2": { "title": 80, "description": 85, "tags": 82, "overall": 82 },
    "model-key-3": { "title": 75, "description": 80, "tags": 78, "overall": 78 }
  }
}`;

    const judgeUserPrompt = `Evaluate these ${validResults.length} SEO-optimized product listings for "${productName}" on ${platform || "Both"} platform and pick the best one:

${validResults.map(r => `
--- Model: ${r.model} ---
Title: ${r.title}
Description: ${r.description}
Tags: ${r.tags.join(", ")}
`).join("\n")}

Score each listing (0-100) for title, description, tags, and overall. Pick the best model. Return ONLY valid JSON.`;

    let bestPick = null;
    try {
      const judgeResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://etsy-amazon-optimizer.vercel.app",
          "X-Title": "Etsy & Amazon Listing Optimizer"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v4-flash:free",
          messages: [
            { role: "system", content: judgeSystemPrompt },
            { role: "user", content: judgeUserPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1024
        })
      });

      if (judgeResponse.ok) {
        const judgeData = await judgeResponse.json();
        const judgeContent = judgeData.choices?.[0]?.message?.content;
        if (judgeContent) {
          let judgeClean = judgeContent.trim();
          if (judgeClean.startsWith('```')) {
            judgeClean = judgeClean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          bestPick = JSON.parse(judgeClean.trim());
        }
      }
    } catch (e) {
      console.error("Judge failed:", e);
    }

    return res.status(200).json({
      results: successfulResults,
      bestPick
    });
  } catch (error) {
    console.error("Error in compare:", error);
    return res.status(500).json({ error: error.message || "An error occurred during comparison." });
  }
}
