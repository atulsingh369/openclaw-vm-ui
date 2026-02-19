# OpenClaw Gateway Testing Console

Next.js 14 (App Router) + TypeScript + TailwindCSS UI for testing chat completions through a secure server-side proxy.

## Clone and run

1. Clone the repository:

```bash
git clone https://github.com/atulsingh369/openclaw-vm-ui.git
```

2. Move into the project:

```bash
cd openclaw-vm-ui
```

3. Install dependencies:

```bash
npm install
```

4. Create a local env file:

```bash
cp .env.example .env.local
```

5. Add the required secret(s) in `.env.local`.
   Do not commit `.env.local` to git.

Minimum required variable:

```env
OPENCLAW_GATEWAY_TOKEN=replace_with_value_provided_by_admin
OPENCLAW_GATEWAY_URL=http://[IP_ADDRESS]/v1/chat/completions
```

6. Start the development server:

```bash
npm run dev
```

7. Open the app:

`http://localhost:3000`

## Production run

```bash
npm run build
npm run start
```

## Security notes

- The browser calls only `/api/chat`.
- Gateway credentials stay server-side in environment variables.
- The app does not expose gateway token values to clients.
- Never commit real secrets to this public repository.

## Features

- Next.js 14 App Router
- TypeScript everywhere
- TailwindCSS dark UI
- Multi-turn conversation history
- Optional system message
- Loading and error toast states
- Raw JSON toggle for debugging
- Clear chat action
- Copy-to-clipboard per message
- Optional streaming mode
