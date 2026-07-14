/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Netlify serverless function — the deployed twin of the `/api/assistant/chat`
 * route in server.ts. Netlify only serves the static client, so this function
 * is what actually reaches Ollama Cloud in production.
 *
 * Required Netlify environment variables (Site settings → Environment variables):
 *   OLLAMA_HOST     = https://ollama.com        (Ollama Cloud; NOT localhost)
 *   OLLAMA_API_KEY  = <free key from https://ollama.com/settings/keys>
 *   OLLAMA_MODEL    = gpt-oss:120b   (or gpt-oss:20b for faster replies)
 *
 * Zero external dependencies — uses the global fetch built into Netlify's
 * Node 18+ runtime, so it deploys without any bundling of node_modules.
 */

function buildAssistantSystemPrompt(snapshot) {
  const snap = snapshot ?? { note: "No financial data was provided." };
  return `You are "Dispute Assistant", a personal wallet and expense-splitting assistant embedded inside the Dispute app.

You are given a JSON snapshot of the user's REAL, current financial data (currency: Indian Rupees, ₹). It was computed directly from the database, so it is the single source of truth.

ABSOLUTE RULES — follow strictly, no exceptions:
1. Use ONLY the numbers, names, groups, and categories that appear in the snapshot. NEVER invent, estimate, extrapolate, or guess a figure. Do not do your own arithmetic — only use totals that are already present in the snapshot.
2. If the user asks about something not in the snapshot, say plainly that you don't have that data yet. Never fabricate to fill a gap.
3. Currency is always ₹ (INR). Show amounts exactly as written in the snapshot.
4. Call the user "you". Other people are named in the snapshot.
5. Be direct and confident when the data is present — do NOT hedge, apologise, or refuse. Answer the exact question first, then add a short explanation only if useful.
6. For "how / why did I spend this much" questions, break it down using categoryBreakdown and topExpenses from the snapshot.
7. Budgets: if a group's budget "level" is "at risk" or "over budget", proactively warn the user and reference the exact remaining amount. If the user asks whether they can afford to spend ₹X, compare ₹X against that group's "remaining" and tell them the resulting status honestly.
8. Keep answers concise — a few sentences or a short bullet list. Do not output large JSON or markdown tables.

The "facts" array in the snapshot contains verified, true statements you may quote directly.

SNAPSHOT (the single source of truth):
${JSON.stringify(snap)}`;
}

const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const { messages, snapshot } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages)) {
      return json(400, { error: "'messages' must be an array" });
    }

    const host = (process.env.OLLAMA_HOST || "https://ollama.com").replace(/\/+$/, "");
    const model = process.env.OLLAMA_MODEL || "gpt-oss:120b";
    const apiKey = process.env.OLLAMA_API_KEY;

    // A serverless function can never reach a localhost Ollama — it must use
    // Ollama Cloud, which requires a (free) API key.
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

    // Only forward role/content; keep the last 12 turns to bound context size.
    const trimmed = messages
      .slice(-12)
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content }));

    const chatMessages = [
      { role: "system", content: buildAssistantSystemPrompt(snapshot) },
      ...trimmed,
    ];

    const ollamaRes = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: false,
        options: { temperature: 0.2 },
      }),
    });

    if (!ollamaRes.ok) {
      const detail = await ollamaRes.text();
      return json(502, {
        error: `Assistant model error (HTTP ${ollamaRes.status}). ${detail.slice(0, 300)}`,
      });
    }

    const data = await ollamaRes.json();
    const reply = data?.message?.content?.trim() || "";
    if (!reply) {
      return json(502, { error: "The assistant returned an empty response." });
    }

    return json(200, { reply });
  } catch (err) {
    return json(500, { error: err?.message || "Assistant request failed" });
  }
};
