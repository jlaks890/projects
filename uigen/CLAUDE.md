# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # One-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all Vitest tests
npm run db:reset     # Reset SQLite database
```

Single test: `npx vitest run <path>` (e.g., `npx vitest run src/lib/file-system.test.ts`)

Environment: copy `.env.example` to `.env` and add `ANTHROPIC_API_KEY`. Without it, the app falls back to a mock provider that returns demo components.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude generates code that runs instantly in an iframe — no files ever touch disk.

### Core Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`) — In-memory file tree. All AI tools (`str_replace_editor`, `file_manager`) and the preview engine operate on this. Supports serialize/deserialize for DB persistence.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) — Transforms the virtual FS into a runnable iframe:
1. Babel transpiles JSX for each file
2. `createImportMap()` builds an ES module import map: `@/` aliases → blob URLs, third-party packages → `esm.sh` CDN
3. `createPreviewHTML()` wraps everything in an iframe document with Tailwind CDN and an ErrorBoundary

**AI Chat API** (`src/app/api/chat/route.ts`) — Streams responses from Claude (Vercel AI SDK). Receives serialized file system, instantiates a `VirtualFileSystem`, lets Claude call tools against it, then saves the final state to Prisma.

**AI Tools** (`src/lib/tools/`) — Two tools exposed to Claude:
- `str_replace_editor`: view, create, str_replace, insert operations on files
- `file_manager`: rename and delete files

### Context Providers

Both wrap the main UI and bridge state between React and the virtual FS:

- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`) — Holds the `VirtualFileSystem` instance and a `refreshTrigger`. Dispatches AI tool call results to update the FS and notify components.
- **ChatContext** (`src/lib/contexts/chat-context.tsx`) — Manages conversation history, serializes the FS with each message, and routes tool call results back into `FileSystemContext`.

### Authentication & Persistence

- JWT-based auth (stored in cookies); middleware protects `/api/projects` and `/api/filesystem`
- Authenticated users: project state (messages + serialized FS) saved to SQLite via Prisma after each AI response
- Anonymous users: session tracked in localStorage; no persistence between sessions

### Data Flow (generation cycle)

1. User submits a message → ChatContext POSTs to `/api/chat` with conversation history + serialized FS
2. Claude streams a response, calling `str_replace_editor`/`file_manager` tools
3. Tool results stream back; `FileSystemContext.handleToolCall` applies mutations to the in-memory FS
4. `PreviewFrame` detects `refreshTrigger` change → rebuilds the import map + HTML → updates the iframe
5. On finish, authenticated: Prisma saves messages + `fileSystem.serialize()` to the Project row

### Mock Provider

`src/lib/provider.ts` exports `getLanguageModel()`. Without `ANTHROPIC_API_KEY`, it returns a `MockLanguageModel` that simulates tool calls and returns canned components (Counter, ContactForm, Card). Useful for development without an API key.

### Testing

Tests live alongside source files (`*.test.ts`/`*.test.tsx`). Key test files:
- `src/lib/file-system.test.ts`
- `src/lib/transform/jsx-transformer.test.ts`
- `src/lib/contexts/chat-context.test.tsx`
- `src/lib/contexts/file-system-context.test.tsx`
