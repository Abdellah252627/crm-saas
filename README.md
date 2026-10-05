# CRM SaaS

A full-stack Customer Relationship Management (CRM) application built with modern web technologies. Designed for scalability, maintainability, and a polished Arabic-first user experience.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Environment Variables](#environment-variables)
  - [Backend](#backend-environment-variables)
  - [Frontend](#frontend-environment-variables)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Build](#production-build)
  - [Docker](#docker)
- [CI/CD](#cicd)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

CRM SaaS is a comprehensive customer relationship management platform that enables teams to manage leads, track interactions, and visualize sales pipelines. The application is built as a modern monorepo with a clean separation between the Express 5 backend API and the React 19 frontend.

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Language**: TypeScript 5.7
- **ORM**: Prisma 6
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT with refresh token rotation
- **Validation**: Zod
- **Testing**: Node.js built-in test runner (`node:test`)
- **Security**: Helmet, CORS, rate limiting

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 7
- **Data Fetching**: TanStack React Query 5
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit/core
- **Notifications**: Sonner
- **HTTP Client**: Axios

## Features

- **Authentication & Authorization**: Secure JWT-based auth with refresh token rotation and session management
- **Client Management**: Full CRUD operations for clients with search, filtering, and pagination
- **Pipeline Management**: Kanban-style drag-and-drop board for tracking leads through stages (Lead → Contacted → Proposal → Won/Lost)
- **Contact Logging**: Track communications (calls, emails, meetings) per client
- **Dashboard Analytics**: Real-time KPIs, stage distribution charts, daily trends, and recent activity feeds
- **Optimistic Updates**: Seamless UX with React Query optimistic mutations and automatic rollback on failure
- **Arabic-First RTL Design**: Fully localized interface with proper right-to-left layout
- **Toast Notifications**: Context-aware success, error, and loading notifications via Sonner
- **Error Handling**: Global error boundary, API error normalization, and graceful session expiry handling
- **CI/CD**: Automated type checking, unit tests, build verification, and linting via GitHub Actions
- **Docker Ready**: Multi-stage Dockerfiles and docker-compose for one-command deployment

## Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: Neon account or local PostgreSQL instance
- **Docker**: Optional, for containerized deployment

## Installation

### Backend

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate dev
```

### Frontend

```bash
cd frontend
npm ci
```

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
PORT=4000

# PostgreSQL Connection (Neon or local)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

# JWT Configuration
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGIN=http://localhost:5173

# Optional: Rate Limiting
RATE_LIMIT_ENABLED=true
LOGIN_RATE_LIMIT=30
REGISTER_RATE_LIMIT=20
API_RATE_LIMIT=600
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:4000
```

## Running the Application

### Development Mode

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`.

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Docker

```bash
docker compose up --build
```

The application will be available at `http://localhost` (frontend) and `http://localhost:4000` (backend API).

## CI/CD

The project uses GitHub Actions for continuous integration. The workflow runs on every push and pull request to the `main` branch.

### Backend CI
- TypeScript type checking (`tsc --noEmit`)
- Prisma Client generation
- Unit tests via `node:test`
- E2E tests (optional, gated by `E2E_ENABLED` variable)

### Frontend CI
- TypeScript build verification (`tsc -b && vite build`)
- Oxlint static analysis

Both jobs run independently; a failure in one does not block the other.

## Project Structure

```
crm-saas/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/      # Auth, validation, error handling, rate limiting
│   │   ├── prisma/          # Prisma Client and schema
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   └── utils/           # AppError, request helpers
│   ├── tests/               # Unit and integration tests
│   ├── postman/             # Postman collection for API testing
│   ├── Dockerfile           # Multi-stage production Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance and API modules
│   │   ├── components/      # Reusable UI components
│   │   │   └── ui/          # Design system (Button, Input)
│   │   ├── hooks/           # Custom React Query hooks
│   │   ├── lib/             # Utilities (toast, formatting, UI tokens)
│   │   ├── pages/           # Route-level page components
│   │   └── types/           # TypeScript type definitions
│   ├── Dockerfile           # Multi-stage build + nginx
│   ├── nginx.conf           # SPA routing configuration
│   └── package.json
├── docker-compose.yml       # Full-stack container orchestration
└── .github/
    └── workflows/
        └── ci.yml           # GitHub Actions CI pipeline
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Authenticate and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Revoke refresh token |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients (supports `stage`, `search`, `page`, `limit` query params) |
| GET | `/api/clients/:id` | Get client details |
| POST | `/api/clients` | Create a new client |
| PATCH | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/:clientId/contacts` | List contacts for a client |
| POST | `/api/clients/:clientId/contacts` | Create a contact |
| DELETE | `/api/clients/:clientId/contacts/:id` | Delete a contact |

### Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/clients/:id` | Move client to a new stage (`{ stage: "STAGE_NAME" }`) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get aggregated stats (total clients, by stage, recent contacts, new clients) |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and code is linted before submitting a PR.

## License

This project is proprietary software. All rights reserved.
