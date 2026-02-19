# OpenClaw Gateway Testing Console (Next.js 14)

Production-ready Next.js 14 + TypeScript + TailwindCSS web app for testing OpenClaw Gateway chat completions through a secure server-side proxy.

## Features

- Next.js 14 App Router
- TypeScript across server and client code
- TailwindCSS dark responsive UI
- Secure server-side proxy (`/api/chat`) using `OPENCLAW_GATEWAY_TOKEN`
- Conversation history with multi-turn chat
- Optional system message input
- Loading state and error toast
- Raw JSON response toggle
- Auto-scroll chat window
- Clear chat button
- Copy-to-clipboard for each message
- Optional streaming mode (SSE-style parsing)

## Project structure

```text
openclaw-vm-ui/
  app/
    api/
      chat/
        route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    ChatInput.tsx
    ChatMessage.tsx
  lib/
    openclaw.ts
  public/
  .env.example
  .eslintrc.json
  .gitignore
  next-env.d.ts
  next.config.mjs
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
  README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Set your gateway token in `.env.local`:

```env
OPENCLAW_GATEWAY_TOKEN=your_real_gateway_token
OPENCLAW_GATEWAY_URL=http://172.203.222.133:18789/v1/chat/completions
```

4. Run development server:

```bash
npm run dev
```

5. Open:

`http://localhost:3000`

## API flow and security

- Browser calls `POST /api/chat` only.
- `app/api/chat/route.ts` validates request body and forwards to the OpenClaw Gateway.
- Token is read only on server from `process.env.OPENCLAW_GATEWAY_TOKEN`.
- Token is never returned to client and never logged.

## Request body used by frontend

```json
{
  "model": "openclaw:main",
  "stream": false,
  "messages": [
    { "role": "system", "content": "You are precise." },
    { "role": "user", "content": "Hello" }
  ]
}
```

## Build and run production

```bash
npm run build
npm run start
```

## Notes

- If streaming is enabled in the UI, the client expects SSE-style chunks (`data: {...}`).
- If your gateway returns a different streaming format, adjust stream parsing in `app/page.tsx`.
