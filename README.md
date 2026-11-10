# Selfassistant

Selfassistant is a local-first workspace for turning articles, notes, PDFs, images, and saved web pages into organized knowledge.

It keeps captured source files in your own data directory and adds editable analysis around them. You can review a quick triage card, understand the main ideas, inspect claims, question assumptions, and connect related sources from one workspace.

## What it provides

- Capture pasted text, public URLs, PDFs, images, and browser pages.
- Preserve the original captured content alongside generated files.
- Generate an editable digest, critique, claims, and triage recommendation.
- Browse sources as a tree or a flat library and organize them into folders.
- Compare ideas across sources and view connections in the knowledge graph.
- Ask the configured agent about your library or selected source text.
- Keep a personal Notebook for drafts and synthesized notes.
- Discover related reading through the optional interest feed.

Selfassistant runs locally. The web interface is a view over files on your machine, so your library remains available and editable outside the application.

## Requirements

- Node.js 20 or newer
- One agent provider:
  - Claude Code installed and authenticated locally
  - OpenAI Codex installed and authenticated locally
  - DeepSeek API access with `DEEPSEEK_API_KEY`

## Run locally

```bash
git clone https://github.com/Ward-wang13/selfassistant.git
cd selfassistant
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Selfassistant will ask you to connect an agent provider before entering the workspace.

For DeepSeek, add the key to `.env.local`:

```dotenv
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

You can choose the provider later in Settings. Claude Code and Codex are useful when the agent needs local file tools, while DeepSeek provides hosted text analysis and chat.

## Data and privacy

The default data directory is `./user_data`. Choose another location with:

```dotenv
SELFASSISTANT_ROOT=/path/to/your/selfassistant-data
```

A source entry stores its capture metadata and original content separately from derived files such as `content.md`, `analysis.json`, and `README.md`. Original files are kept as the source of truth; generated analysis can be edited or regenerated.

When DeepSeek is selected, prompts are sent to DeepSeek through your own API key. Local Claude Code and Codex providers use their local authenticated sessions. Do not commit `.env.local` or personal data directories.

## Browser extension

The optional unpacked extension in `extension/` adds one-click capture for pages that need an active browser session, including JavaScript-rendered or logged-in pages.

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select **Load unpacked** and choose this repository's `extension/` directory.
4. Start Selfassistant and use the capture button on a page.

## Project layout

```text
src/          Next.js application and server-side file operations
extension/    Optional browser capture extension
docs/         Product and onboarding documentation
sample_data/  Safe example data for a first run
tests/        Vitest test suite
```

## Useful commands

```bash
npm run dev       # start the development server
npm run build     # create a production build
npm run start     # serve the production build
npm run lint      # run ESLint
npm test          # run the test suite
```

See [docs/ONBOARDING.md](docs/ONBOARDING.md) for the first-run walkthrough and configuration details.
