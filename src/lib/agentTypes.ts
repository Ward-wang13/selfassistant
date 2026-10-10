export type AgentProvider = "claude" | "codex" | "deepseek";

export type AgentConnectionState = "ready" | "missing" | "error";

export interface AgentProviderDetails {
  id: AgentProvider;
  label: string;
  shortLabel: string;
  command: string;
  installHint: string;
  installCommand: string;
  docsUrl: string;
}

export interface AgentStatus {
  provider: AgentProvider;
  label: string;
  command: string;
  state: AgentConnectionState;
  version?: string;
  message: string;
}

export const DEFAULT_AGENT_PROVIDER: AgentProvider = "deepseek";

export const AGENT_PROVIDER_DETAILS: Record<AgentProvider, AgentProviderDetails> = {
  claude: {
    id: "claude",
    label: "Claude Code",
    shortLabel: "Claude",
    command: "claude",
    installHint: "Install Claude Code and sign in, or switch to Codex CLI.",
    installCommand: "npm install -g @anthropic-ai/claude-code",
    docsUrl: "https://docs.claude.com/en/docs/claude-code/setup",
  },
  codex: {
    id: "codex",
    label: "Codex CLI",
    shortLabel: "Codex",
    command: "codex",
    installHint: "Install Codex CLI and sign in with your OpenAI account, or switch to Claude Code.",
    installCommand: "npm install -g @openai/codex",
    docsUrl: "https://github.com/openai/codex",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek API",
    shortLabel: "DeepSeek",
    command: "https://api.deepseek.com",
    installHint: "Set DEEPSEEK_API_KEY in .env.local, then choose a DeepSeek model.",
    installCommand: "DEEPSEEK_API_KEY=your_api_key",
    docsUrl: "https://api-docs.deepseek.com/",
  },
};

export function isAgentProvider(value: unknown): value is AgentProvider {
  return value === "claude" || value === "codex" || value === "deepseek";
}
