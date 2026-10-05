# CRM SaaS — Frontend

Frontend for the CRM SaaS app, built with React 19 + TypeScript + Vite, Tailwind CSS,
React Router, TanStack React Query, and Axios. It talks to the Express 5 + Prisma
backend at `http://localhost:4000`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # preview the production build
```

## Environment

Create `.env` (see `.env.example`):

```
VITE_API_URL=http://localhost:4000
```

## Structure

```
src/
├── api/          axios instance (baseURL, 10s timeout, Bearer interceptor,
│                 401 auto-refresh, 5xx logging)
│                 + auth API + clients API (toast.promise integration)
├── lib/          toast.ts (sonner wrapper: success/error/loading/promise)
├── components/   Layout, ProtectedRoute, ClientModal, ErrorBoundary,
│                 Toaster, PagePlaceholder, ui/ (Button, Input)
├── pages/        Dashboard, Login, Register, Clients, Pipeline
├── hooks/        useAuth, useClients (optimistic updates), useDebouncedValue
└── types/        shared TypeScript interfaces (auth, client)
```

## Toast notifications

`lib/toast.ts` wraps Sonner. Mutation API functions (create/update/delete
client, login/register/logout) use `toast.promise` with Arabic
loading/success/error messages, including the backend error detail when
available. List queries intentionally show no toasts — they refetch on
invalidation and a loading toast on every refetch would be noisy.

`<Toaster />` is mounted in `main.tsx` (top-center, rich colors, RTL).

## Optimistic updates

`useClients` mutations apply changes to the React Query cache before the
server responds (`onMutate` snapshots all `["clients", ...]` queries,
cancels in-flight refetches, and applies the change), roll back on
`onError`, and invalidate on `onSettled` so server data wins.

## Error boundary

`ErrorBoundary` catches render errors in the protected routes, logs them,
and shows a retry button instead of a blank screen.

## Protected routes

`/`, `/clients` and `/pipeline` are wrapped in `ProtectedRoute`, which
saves the requested URL and redirects to `/login` when no access token
exists in `localStorage`; after login the app navigates back to the
original URL.

## Clients

- `useClients(params)` fetches `GET /api/clients` with optional `stage`,
  `search`, `page` and `limit` (React Query, key `["clients", params]`).
- `useCreateClient` / `useUpdateClient` / `useDeleteClient` invalidate the
  `["clients"]` queries on success, so the table refreshes automatically
  after every mutation.
- The Clients page debounces the search input (300ms), filters by stage,
  and paginates using the backend's `totalPages` metadata.
- `ClientModal` handles both create and edit (pass `client?`) with
  React Hook Form + Zod validation.

## Pipeline (Kanban)

- `useStageClients(stage)` fetches each stage's clients through the
  shared `["clients", ...]` query prefix, so the Kanban and the
  Clients page stay in sync automatically.
- `useMoveToStage()` applies an optimistic move across the stage
  caches and the stats query, rolls back on failure, and
  invalidates on settle.
- Drag & drop uses `@dnd-kit/core`: cards are draggable, columns
  are droppable, and `DndContext.onDragEnd` triggers the move.
- Note: the backend `Stage` enum is `LEAD, CONTACTED, PROPOSAL,
  WON, LOST` — the Kanban renders exactly these five stages.
- `getStageStats()` reads `GET /api/dashboard` (`byStage` counts).

## Routes

| Path         | Page                       |
| ------------ | -------------------------- |
| `/`          | Dashboard (protected) |
| `/login`     | Sign in                    |
| `/register`  | Create account             |
| `/clients`   | Clients (protected)        |
| `/pipeline`  | Pipeline (protected)       |
