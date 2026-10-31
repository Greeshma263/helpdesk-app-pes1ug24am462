# Campus Help Desk Board

SRN: `PES1UG24AM462`

A Next.js App Router application for posting and viewing the latest campus
help requests. PostgreSQL is the permanent source of truth, and Redis caches
the latest requests and stores the board view counter.

## Requirements

- Node.js and npm
- PostgreSQL
- Redis

The application uses the `pg` and `redis` packages.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database:

   ```bash
   createdb campus_helpdesk
   ```

   If the database already exists, keep it and continue.

3. Create the `help_requests` table:

   ```sql
   CREATE TABLE help_requests (
     id SERIAL PRIMARY KEY,
     student_name VARCHAR(50) NOT NULL,
     message VARCHAR(200) NOT NULL,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

4. Create `.env.local` in the project root:

   ```env
   DATABASE_URL=postgresql://greeshma@localhost:5432/campus_helpdesk
   REDIS_URL=redis://localhost:6379
   ```

   Add the PostgreSQL password to `DATABASE_URL` if the local PostgreSQL
   installation requires password authentication. Do not commit `.env.local`.

5. Start PostgreSQL and Redis, then run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## API

- `POST /api/requests` validates and inserts a request into PostgreSQL, then
  invalidates the `help:latest` Redis key.
- `GET /api/requests` returns the latest 10 requests, using Redis when the
  `help:latest` cache is available and PostgreSQL otherwise. The cache TTL is
  60 seconds.
- `GET /api/views` increments `help:views` with Redis `INCR` and returns the
  updated count.

If Redis is unavailable, request reads continue from PostgreSQL. The view
counter reports an error because it requires Redis.

## Verification

Run the checks used before submission:

```bash
npm run lint
npm run build
```

The application can then be checked manually by posting a valid request,
submitting empty fields, refreshing the board, and observing PostgreSQL and
Redis as the request data sources. A first request-list read after a cache
miss reports `PostgreSQL`; a repeated read within 60 seconds reports `Redis`.

## GitHub files

Commit `package.json`, `package-lock.json`, the application source, and this
README. The repository ignores `node_modules`, `.next`, and `.env.local`.
