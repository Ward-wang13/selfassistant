import { promises as fs } from "fs";
import path from "path";
import type { AgentStatus } from "./agentTypes";

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_MODELS = [
  { id: "deepseek-flash", label: "DeepSeek Flash", desc: "Fast general-purpose model" },
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", desc: "Higher-capability model" },
];
export const DEFAULT_DEEPSEEK_MODEL = DEEPSEEK_MODELS[0].id;

interface DeepSeekMessage { role: "system" | "user" | "assistant"; content: string; }
interface DeepSeekResponse { choices?: Array<{ message?: { content?: string | null } }>; error?: { message?: string }; }

function getApiKey(): string | undefined { return process.env.DEEPSEEK_API_KEY?.trim() || undefined; }
function getBaseUrl(): string { return (process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL).replace(/\/$/, ""); }
export function getDeepSeekModel(model?: string): string { return model?.trim() || DEFAULT_DEEPSEEK_MODEL; }
function missingKeyMessage(): string { return "DeepSeek API is not configured. Set DEEPSEEK_API_KEY in .env.local and restart the app."; }

async function parseError(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  try { return (JSON.parse(body) as DeepSeekResponse).error?.message || body || `DeepSeek API returned HTTP ${response.status}`; }
  catch { return body || `DeepSeek API returned HTTP ${response.status}`; }
}

async function createCompletion(messages: DeepSeekMessage[], model: string, stream: boolean, signal?: AbortSignal): Promise<Response> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error(missingKeyMessage());
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: getDeepSeekModel(model), messages, stream }),
    signal,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response;
}

export async function callDeepSeek(prompt: string, model?: string): Promise<string> {
  const response = await createCompletion([{ role: "user", content: prompt }], getDeepSeekModel(model), false);
  const content = (await response.json() as DeepSeekResponse).choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek API returned an empty response.");
  return content.trim();
}

export async function callDeepSeekWithFileAccess(prompt: string, filePath: string, model?: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf"].includes(extension)) {
    throw new Error("DeepSeek text models cannot inspect local image/PDF files. Switch to Claude Code or Codex for file analysis.");
  }
  const fileContent = await fs.readFile(filePath, "utf-8");
  return callDeepSeek(`${prompt}\n\n<local-file path="${filePath}">\n${fileContent}\n</local-file>`, model);
}

export async function checkDeepSeekModel(model?: string): Promise<{ ok: boolean; message: string }> {
  try { await callDeepSeek("Reply with the single word: ok", model); return { ok: true, message: "DeepSeek model responded." }; }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "DeepSeek model check failed." }; }
}

export function getDeepSeekStatus(): AgentStatus {
  const configured = Boolean(getApiKey());
  return {
    provider: "deepseek", label: "DeepSeek API", command: getBaseUrl(), state: configured ? "ready" : "missing",
    message: configured ? `DeepSeek API key detected (${getDeepSeekModel()}).` : missingKeyMessage(),
  };
}

function emitEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: object): void {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`));
}

export async function createDeepSeekChatResponse(prompt: string, model?: string, signal?: AbortSignal): Promise<Response> {
  try {
    const response = await createCompletion([{ role: "user", content: prompt }], getDeepSeekModel(model), true, signal);
    if (!response.body) throw new Error("DeepSeek API returned no stream body.");
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) emitEvent(controller, { type: "text", content });
              } catch { /* Ignore incomplete provider frames. */ }
            }
          }
          controller.close();
        } catch (error) {
          emitEvent(controller, { type: "error", message: error instanceof Error ? error.message : "DeepSeek stream failed." });
          controller.close();
        } finally { reader.releaseLock(); }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "DeepSeek request failed." }), {
      status: 502, headers: { "Content-Type": "application/json" },
    });
  }
}
