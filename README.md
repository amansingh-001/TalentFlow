# TalentFlow

TalentFlow is an AI-assisted recruiting platform for small and medium businesses. It helps teams manage jobs, upload resumes, evaluate candidate-job fit, and move applicants through a pipeline from application to interview.

## What It Does

- Manage job postings and hiring requirements
- Upload candidate resumes (PDF/DOCX) with server-side parsing
- Use Gemini-powered analysis to extract candidate profile insights
- Score candidate-job match with explainable AI reasoning
- Track applications across pipeline stages (Applied, Screening, Interview, Offer, etc.)
- View interview schedules and hiring metrics in a dashboard

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, Wouter
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL (Neon) with Drizzle ORM
- AI: Google Gemini (`gemini-2.5-flash`)
- File processing: Multer, `pdf-parse`, `mammoth`

## Project Structure

```text
TalentFlow/
  client/            # React frontend
  server/            # Express API and app server
  shared/            # Shared schema/types (Drizzle + Zod)
  uploads/           # Uploaded resume files
  drizzle.config.ts  # Drizzle configuration
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (Neon recommended)
- Gemini API key

## Environment Variables

Create a `.env` file in the repository root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

Notes:
- `DATABASE_URL` is required by both runtime and Drizzle config.
- `GEMINI_API_KEY` enables resume analysis and match scoring.
- If `PORT` is not set, the server defaults to `5000`.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Push schema to your database:

```bash
npm run db:push
```

3. Start development server:

```bash
npm run dev
```

App and API are served from the same server process.

## Available Scripts

- `npm run dev`: Start development server (Express + Vite middleware)
- `npm run build`: Build frontend and bundle backend into `dist/`
- `npm run start`: Run production build from `dist/index.js`
- `npm run check`: Type-check TypeScript
- `npm run db:push`: Push Drizzle schema changes to database

## Core Routes

Frontend pages:

- `/` Dashboard
- `/jobs` Jobs list
- `/jobs/new` Create job
- `/candidates` Candidates list
- `/candidates/upload` Resume upload
- `/applications/:id` Application details
- `/pipeline` Kanban pipeline
- `/schedule` Interview schedule
- `/settings` Settings

API endpoints (selected):

- `GET /api/stats`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `GET /api/candidates`
- `GET /api/candidates/:id`
- `POST /api/candidates/upload`
- `GET /api/applications`
- `GET /api/applications/recent`
- `GET /api/applications/pipeline`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id/status`
- `GET /api/interviews`
- `GET /uploads/:filename`

## Resume Upload Behavior

- Allowed file types: `.pdf`, `.docx`
- Max file size: 10 MB
- Uploaded files are stored in `uploads/`
- Server extracts text and runs AI analysis before creating/updating candidate records

## Production Build

```bash
npm run build
npm run start
```

This creates:
- Frontend static assets (Vite output)
- Backend bundle at `dist/index.js`

## Troubleshooting

- `DATABASE_URL must be set`: ensure `.env` exists and is loaded.
- AI analysis failures: verify `GEMINI_API_KEY` and quota; upload still completes with limited fallback data in some cases.
- File upload errors: confirm the file is PDF or DOCX and under 10 MB.

## License

MIT
