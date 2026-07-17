/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Netlify serverless function — generates 3 short spending insights from the
 * group's real expenses using Ollama Cloud (the same backend as the wallet
 * assistant). Replaces the previous Gemini-backed implementation.
 *
 * Required Netlify environment variables (Site settings → Environment variables):
 *   OLLAMA_HOST     = https://ollama.com        (Ollama Cloud; NOT localhost)
 *   OLLAMA_API_KEY  = <free key from https://ollama.com/settings/keys>
 *   OLLAMA_MODEL    = gpt-oss:120b   (or gpt-oss:20b for faster replies)
 *
 * Returns a JSON array [{ type, title, message }, ...] directly, which is the
 * exact shape the Dashboard and GroupDetail insight panels consume.
 */

const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

function buildInsightsPrompt(expenses, budget, memberNames) {
  return `You are a witty personal-finance assistant embedded in the Equaris expense-splitting app (currency: Indian Rupees, ₹).

Group overall budget: ₹${budget || 0}.
Group members (uid -> name): ${JSON.stringify(memberNames || {})}.
Logged transactions (JSON): ${JSON.stringify(expenses || [])}.

Generate EXACTLY 3 short insights or tips based ONLY on the data above. Each must be 1-2 sentences, stylish, using clean modern Gen-Z premium slang (e.g. "Goa plans are eating up the budget", "Chai spend looking suspicious"). Do NOT include emojis anywhere.

Return ONLY valid JSON in exactly this shape, nothing else:
{"insights":[{"type":"budget|warning|tip|chill","title":"short micro title","message":"the insight"}]}`;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const { expenses, budget, memberNames } = JSON.parse(event.body || "{}");

    const host = (process.env.OLLAMA_HOST || "https://ollama.com").replace(/\/+$/, "");
    const model = process.env.OLLAMA_MODEL || "gpt-oss:120b";
    const apiKey = process.env.OLLAMA_API_KEY;

    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return json(500, {
        error:
          "OLLAMA_HOST points at localhost, which Netlify cannot reach. Set OLLAMA_HOST=https://ollama.com and add OLLAMA_API_KEY in your Netlify environment variables.",
      });
    }
    if (host.includes("ollama.com") && !apiKey) {
      return json(500, {
        error:
          "OLLAMA_API_KEY is not set. Create a free key at https://ollama.com/settings/keys and add it in Netlify → Site settings → Environment variables.",
      });
    }

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const ollamaRes = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: buildInsightsPrompt(expenses, budget, memberNames) }],
        stream: false,
        format: "json",
        options: { temperature: 0.7 },
      }),
    });

    if (!ollamaRes.ok) {
      const detail = await ollamaRes.text();
      return json(502, {
        error: `Insights model error (HTTP ${ollamaRes.status}). ${detail.slice(0, 300)}`,
      });
    }

    const data = await ollamaRes.json();
    const raw = data?.message?.content?.trim() || "";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json(502, { error: "The insights model returned invalid JSON." });
    }

    const insights = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.insights)
        ? parsed.insights
        : [];

    return json(200, insights.slice(0, 3));
  } catch (err) {
    return json(500, { error: err?.message || "Insights request failed" });
  }
};
