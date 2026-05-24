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

    // --- PROVIDER CONFIG ---
    // Groq is the primary (truly free: 14,400 req/day, fast)
    const groqKey = process.env.GROQ_API_KEY;
    // OpenRouter is the fallback
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!groqKey && !openrouterKey) {
      return res.status(500).json({ error: "No AI API key configured. Please set GROQ_API_KEY or OPENROUTER_API_KEY in Vercel environment variables." });
    }

    const MODEL_MAP = {
      "deepseek-v4-flash": {
        groq: "deepseek-r1-distill-llama-70b",
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

    // --- TRY GROQ FIRST ---
    if (groqKey) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: selectedModel.groq,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2048,
            response_format: { type: "json_object" }
          })
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            const jsonResponse = JSON.parse(cleanContent.trim());
            if (jsonResponse.title && jsonResponse.description && jsonResponse.tags) {
              return res.status(200).json({
                ...jsonResponse,
                model: model,
                provider: "Groq"
              });
            }
          }
        }
        // Groq failed, log and fall through to OpenRouter
        const groqError = await groqResponse.json().catch(() => ({}));
        console.error("Groq failed:", groqError?.error?.message || groqResponse.status);
      } catch (groqErr) {
        console.error("Groq error:", groqErr.message);
      }
    }

    // --- FALLBACK TO OPENROUTER ---
    if (openrouterKey) {
      try {
        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://etsy-amazon-optimizer.vercel.app",
            "X-Title": "Etsy & Amazon Listing Optimizer"
          },
          body: JSON.stringify({
            model: selectedModel.openrouter,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2048
          })
        });

        const orData = await orResponse.json();

        if (orResponse.ok) {
          const content = orData.choices?.[0]?.message?.content;
          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            const jsonResponse = JSON.parse(cleanContent.trim());
            if (jsonResponse.title && jsonResponse.description && jsonResponse.tags) {
              return res.status(200).json({
                ...jsonResponse,
                model: model,
                provider: "OpenRouter"
              });
            }
          }
        }

        const orError = orData?.error?.message || `OpenRouter error: ${orResponse.status}`;
        throw new Error(orError);
      } catch (orErr) {
        console.error("OpenRouter error:", orErr.message);
        throw new Error(`Both AI providers failed. Groq: no key or error. OpenRouter: ${orErr.message}`);
      }
    }

    throw new Error("No working AI provider available. Please check your API keys.");
  } catch (error) {
    console.error("Error generating listing:", error);
    return res.status(500).json({ error: error.message || "An error occurred during listing generation." });
  }
}
