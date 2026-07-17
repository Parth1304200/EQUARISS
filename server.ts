/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { calculateBalances, generateSettlementSuggestions } from "./src/lib/settleEngine";

/**
 * Strict system prompt for the wallet assistant. The model is only allowed to
 * narrate the EXACT figures in the snapshot — never to compute or invent them.
 */
function buildAssistantSystemPrompt(snapshot: unknown): string {
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

// Lazily initialize Gemini client so we do not crash if API key is temporarily missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please add it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for body parsing
  app.use(express.json({ limit: "15mb" }));

  // API 1: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API 2: Scan Receipt via Gemini Multimodal OCR
  app.post("/api/receipt/scan", async (req, res) => {
    try {
      const { imgBase64, mimeType } = req.body;
      if (!imgBase64) {
        return res.status(400).json({ error: "Missing required parameter 'imgBase64'" });
      }

      const ai = getGeminiClient();
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imgBase64,
        }
      };

      const textPart = {
        text: "You are an expert OCR invoice scanner. Analyze the receipt photo, extract the store or vendor name, date (YYYY-MM-DD), category (food, travel, rent, entertainment, others), total bill amount, and individual purchase items with their costs. If values aren't clear, estimate intelligently. Format output strictly according to the requested JSON structure.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Name of the merchant/store" },
              amount: { type: Type.NUMBER, description: "Total bill transaction amount" },
              category: { type: Type.STRING, description: "Category: food, travel, rent, entertainment, others, healthcare" },
              date: { type: Type.STRING, description: "Y-M-D date of purchase format" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Product item title" },
                    amount: { type: Type.NUMBER, description: "Item price cost" }
                  },
                  required: ["name", "amount"]
                }
              }
            },
            required: ["title", "amount", "category", "date"]
          }
        }
      });

      const textOutput = response.text;
      if (!textOutput) {
        return res.status(500).json({ error: "No response text generated from model" });
      }

      const parsed = JSON.parse(textOutput.trim());
      res.json(parsed);

    } catch (err: any) {
      console.error("Receipt Scan OCR Error:", err);
      res.status(500).json({ error: err.message || "Failed to scan receipt image using Gemini OCR" });
    }
  });

  // API 3: Generate witty Gen-Z insights & warnings from group expenses (Ollama-backed).
  app.post("/api/insights", async (req, res) => {
    try {
      const { expenses, budget, memberNames } = req.body;

      const host = (process.env.OLLAMA_HOST || "https://ollama.com").replace(/\/+$/, "");
      const model = process.env.OLLAMA_MODEL || "gpt-oss:120b";
      const apiKey = process.env.OLLAMA_API_KEY;
      if (host.includes("ollama.com") && !apiKey) {
        return res.status(500).json({
          error: "OLLAMA_API_KEY is not set. Add OLLAMA_API_KEY to your .env file.",
        });
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const prompt = `You are a witty personal-finance assistant embedded in the Equaris expense-splitting app (currency: Indian Rupees, ₹).

Group overall budget: ₹${budget || 0}.
Group members (uid -> name): ${JSON.stringify(memberNames || {})}.
Logged transactions (JSON): ${JSON.stringify(expenses || [])}.

Generate EXACTLY 3 short insights or tips based ONLY on the data above. Each must be 1-2 sentences, stylish, using clean modern Gen-Z premium slang. Do NOT include emojis anywhere.

Return ONLY valid JSON in exactly this shape, nothing else:
{"insights":[{"type":"budget|warning|tip|chill","title":"short micro title","message":"the insight"}]}`;

      const ollamaRes = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          format: "json",
          options: { temperature: 0.7 },
        }),
      });

      if (!ollamaRes.ok) {
        const detail = await ollamaRes.text();
        return res.status(502).json({
          error: `Insights model error (HTTP ${ollamaRes.status}). ${detail.slice(0, 300)}`,
        });
      }

      const data: any = await ollamaRes.json();
      const raw = data?.message?.content?.trim() || "";
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(502).json({ error: "The insights model returned invalid JSON." });
      }
      const insights = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.insights)
          ? parsed.insights
          : [];
      res.json(insights.slice(0, 3));
    } catch (err: any) {
      console.error("Insights Error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch AI insights" });
    }
  });

  // API 4: Optimize debts & suggestions
  app.post("/api/settlements/suggest", (req, res) => {
    try {
      const { members, expenses, groupId } = req.body;
      if (!members || !expenses || !groupId) {
        return res.status(400).json({ error: "Missing parameters members, expenses, or groupId" });
      }

      const balances = calculateBalances(members, expenses);
      const suggestions = generateSettlementSuggestions(groupId, balances);
      res.json({ balances, suggestions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 5: Wallet Assistant chat (Ollama-backed, grounded on a real data snapshot)
  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const { messages, snapshot } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "'messages' must be an array" });
      }

      const host = (process.env.OLLAMA_HOST || "https://ollama.com").replace(/\/+$/, "");
      const model = process.env.OLLAMA_MODEL || "gpt-oss:120b";
      const apiKey = process.env.OLLAMA_API_KEY;

      // Ollama Cloud requires a (free) API key; local Ollama does not.
      if (host.includes("ollama.com") && !apiKey) {
        return res.status(500).json({
          error:
            "OLLAMA_API_KEY is not set. Create a free key at https://ollama.com/settings/keys and add OLLAMA_API_KEY to your .env file.",
        });
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      // Only forward role/content, keep the last 12 turns to bound context size.
      const trimmed = messages
        .slice(-12)
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m: any) => ({ role: m.role, content: m.content }));

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
        console.error("Ollama chat error:", ollamaRes.status, detail);
        return res.status(502).json({
          error: `Assistant model error (HTTP ${ollamaRes.status}). ${detail.slice(0, 300)}`,
        });
      }

      const data: any = await ollamaRes.json();
      const reply = data?.message?.content?.trim() || "";
      if (!reply) {
        return res.status(502).json({ error: "The assistant returned an empty response." });
      }
      res.json({ reply });
    } catch (err: any) {
      console.error("Assistant chat handler error:", err);
      res.status(500).json({ error: err?.message || "Assistant request failed" });
    }
  });

  // Integration with Vite development middleware
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
    console.log(`Dispute full-stack server running securely on port ${PORT}`);
    console.log(`  > Local:            http://localhost:${PORT}`);
    console.log(`  > Note: open via http://localhost:${PORT} (not 127.0.0.1) — 'localhost' is the Firebase-authorized domain.`);
  });
}

startServer().catch((error) => {
  console.error("Sever startup crashed:", error);
});
