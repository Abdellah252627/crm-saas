# CRM SaaS — Frontend

React frontend for the CRM SaaS application. Built with React 19, TypeScript, Vite, and Tailwind CSS.

For full project documentation, see the [root README](../README.md).

## Getting Started

```bash
npm install
npm run dev        # Start dev server at http://localhost:5173
npm run build      # TypeScript check + production build
npm run preview    # Preview production build
```

## Tech Stack

- **React 19** with TypeScript 6
- **Vite 8** for build tooling
- **Tailwind CSS 3** for styling
- **React Router 7** for client-side routing
- **TanStack React Query 5** for server state management
- **React Hook Form + Zod** for form validation
- **Axios** for HTTP requests with interceptors
- **Recharts** for data visualization
- **@dnd-kit/core** for drag-and-drop interactions
- **Sonner** for toast notifications

## Environment

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=http://localhost:4000
```

## Project Structure

```
src/
├── api/              # Axios instance, interceptors, and API modules
├── components/       # Reusable UI components
│   ├── ui/           # Design system primitives (Button, Input)
│   └── *.tsx         # Feature components (ClientModal, Layout, Charts, etc.)
├── hooks/            # Custom React Query hooks
├── lib/              # Shared utilities (toast, formatting, UI tokens)
├── pages/            # Route-level page components
├── types/            # TypeScript type definitions
├── App.tsx           # Route configuration
└── main.tsx          # Application entry point
```

## Key Architecture Decisions

### State Management
- **React Query** handles all server state (clients, contacts, dashboard stats, pipeline data)
- **React Hook Form** manages local form state with Zod validation
- **React Context** (`AuthContext`) provides global auth state

### Optimistic Updates
Client mutations use optimistic updates via React Query:
- `onMutate`: snapshot current cache, cancel in-flight requests, apply optimistic change
- `onError`: restore snapshot on failure
- `onSettled`: invalidate queries to ensure server data wins

### Error Handling
- **Error Boundary** catches render errors in protected routes
- **Axios interceptors** handle 401/refresh flow and network error logging
- **API error normalization** via `getApiErrorMessage()` for consistent Arabic error messages

### RTL & Localization
- Arabic-first interface with `dir="rtl"` on all page containers
- `Intl.DateTimeFormat("ar-EG")` for date formatting
- All user-facing strings in Arabic

## Linting

```bash
npm run lint
```

Uses Oxlint with React and TypeScript plugins.

## Testing

Backend tests are located in the `backend/tests/` directory. Run them from the backend directory:

```bash
cd backend
npm test
```

## Docker

```bash
docker compose up --build
```

See the [root README](../README.md#docker) for details.

## License

Proprietary. All rights reserved.
