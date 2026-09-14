import { Logger } from "@nestjs/common";
import { parseOutingIntent, type OutingIntent } from "@tiptop/domain";

export type AiProvider = {
  parseIntent(text: string, locale: string): Promise<OutingIntent | null>;
  refineCopy(prompt: string, locale: string): Promise<string | null>;
};

const log = new Logger("AiProvider");

function ruleProvider(): AiProvider {
  return {
    async parseIntent(text) {
      return parseOutingIntent(text);
    },
    async refineCopy() {
      return null;
    },
  };
}

function openAiProvider(apiKey: string, model: string): AiProvider {
  return {
    async parseIntent(text, locale) {
      const fallback = parseOutingIntent(text);
      try {
        const raw = await chat(
          apiKey,
          model,
          locale === "en"
            ? "Extract outing constraints as JSON: dateHint (today|tonight|tomorrow|weekend|saturday|sunday|null), hour, durationMin, budgetXaf, partySize, maxKm, category (concert|food|rooftop|piscine|nightlife|sport|culture|travel|fashion|hangout|adventure|wellness|null), vibe (fun|calm|social|spontaneous|new|wild|null), surprise. No personal data."
            : "Extrais les contraintes de sortie en JSON : dateHint, hour, durationMin, budgetXaf, partySize, maxKm, category, vibe, surprise. Aucune donnée personnelle.",
          text.slice(0, 400),
        );
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<OutingIntent>;
        return {
          ...fallback,
          ...parsed,
          rawText: text,
          partySize: Number(parsed.partySize ?? fallback.partySize) || fallback.partySize,
          surprise: Boolean(parsed.surprise ?? fallback.surprise),
        };
      } catch (err) {
        log.warn(`parseIntent fallback: ${err instanceof Error ? err.message : "error"}`);
        return fallback;
      }
    },
    async refineCopy(prompt, locale) {
      try {
        return await chat(
          apiKey,
          model,
          locale === "en"
            ? "Write one short, warm sentence. No private data. No fake names."
            : "Écris une phrase courte et chaleureuse. Aucune donnée privée. Aucun faux nom.",
          prompt.slice(0, 400),
        );
      } catch (err) {
        log.warn(`refineCopy fallback: ${err instanceof Error ? err.message : "error"}`);
        return null;
      }
    },
  };
}

async function chat(apiKey: string, model: string, system: string, user: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } finally {
    clearTimeout(timer);
  }
}

export function createAiProvider(): AiProvider {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return ruleProvider();
  return openAiProvider(key, process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini");
}
