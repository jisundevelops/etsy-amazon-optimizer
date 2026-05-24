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

    const groqKey = process.env.GROQ_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!groqKey && !openrouterKey) {
      return res.status(500).json({ error: "No AI API key configured." });
    }

    const MODELS = {
      "deepseek-v4-flash": {
        groq: "llama-3.3-70b-versatile",
        openrouter: "deepseek/deepseek-v4-flash:free",
        name: "DeepSeek V4 Flash"
      },
      "llama-3.3-70b": {
        groq: "llama-3.3-70b-versatile",
        openrouter: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B"
      },
      "qwen3-32b": {
        groq: "qwen/qwen3-32b",
        openrouter: "qwen/qwen3-next-80b-a3b-instruct:free",
        name: "Qwen3 Next 80B"
      }
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

    const modelEntries = Object.entries(MODELS);

    // Helper: call a single model on Groq or OpenRouter
    async function callModel(modelKey, modelConfig) {
      // Try Groq first
      if (groqKey) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelConfig.groq,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 2048,
              response_format: { type: "json_object" }
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              let clean = content.trim();
              if (clean.startsWith('```')) {
                clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
              }
              const parsed = JSON.parse(clean.trim());
              if (parsed.title && parsed.description && parsed.tags) {
                return { model: modelKey, ...parsed, provider: "Groq" };
              }
            }
          }
        } catch (e) {
          console.error(`Groq failed for ${modelKey}:`, e.message);
        }
      }

      // Fallback to OpenRouter
      if (openrouterKey) {
        try {
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://etsy-amazon-optimizer.vercel.app",
              "X-Title": "Etsy & Amazon Listing Optimizer"
            },
            body: JSON.stringify({
              model: modelConfig.openrouter,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 2048
            })
          });

          if (orRes.ok) {
            const data = await orRes.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              let clean = content.trim();
              if (clean.startsWith('```')) {
                clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
              }
              const parsed = JSON.parse(clean.trim());
              if (parsed.title && parsed.description && parsed.tags) {
                return { model: modelKey, ...parsed, provider: "OpenRouter" };
              }
            }
          }
        } catch (e) {
          console.error(`OpenRouter failed for ${modelKey}:`, e.message);
        }
      }

      throw new Error(`Both providers failed for ${modelConfig.name}`);
    }

    // Run all 3 models in parallel
    const results = await Promise.allSettled(
      modelEntries.map(([key, config]) => callModel(key, config))
    );

    const successfulResults = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { model: modelEntries[i][0], error: r.reason?.message || "Failed" };
    });

    const validResults = successfulResults.filter(r => !r.error);

    if (validResults.length === 0) {
      throw new Error("All three AI models failed. Please check your API keys (GROQ_API_KEY and/or OPENROUTER_API_KEY) in Vercel environment variables.");
    }

    // --- AI JUDGE ---
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
      // Use Groq for judge (fast & free) if available, otherwise OpenRouter
      const judgeProvider = groqKey ? "groq" : "openrouter";
      let judgeRes;

      if (groqKey) {
        judgeRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: judgeSystemPrompt },
              { role: "user", content: judgeUserPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: "json_object" }
          })
        });
      } else if (openrouterKey) {
        judgeRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterKey}`,
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
      }

      if (judgeRes && judgeRes.ok) {
        const judgeData = await judgeRes.json();
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
