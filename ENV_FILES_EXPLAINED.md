# Why Two .env Files?

## Quick Answer
- **`.env`** → For Prisma CLI only (database connection for `pnpm db:push`, `pnpm db:studio`)
- **`.env.local`** → For Next.js app (all secrets: GROQ, Upstash, Neon, etc.)

Both files are **gitignored** - they never get committed.

---

## Detailed Explanation

### `.env.local` (Main secrets file)
**Used by:** Next.js runtime (when app runs with `pnpm dev` or deployed on Vercel)

**Contains:**
```bash
# AI Configuration
GROQ_API_KEY=gsk_...

# Upstash Vector & Redis
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Neon Postgres
DATABASE_URL=postgresql://...

# (All your other Neon connection strings)
```

**Why needed:** Next.js automatically loads `.env.local` when the app runs.

---

### `.env` (Prisma-specific)
**Used by:** Prisma CLI commands only (`pnpm db:push`, `pnpm db:studio`, `pnpm db:generate`)

**Contains:**
```bash
# Just the database URL for Prisma
DATABASE_URL=postgresql://...
```

**Why needed:** Prisma CLI looks for `.env` by default (not `.env.local`). So when you run `pnpm db:studio`, Prisma reads this file to connect to Neon.

---

## Summary

| File | Purpose | Used By |
|------|---------|---------|
| `.env.local` | All app secrets | Next.js runtime (dev & production) |
| `.env` | Database URL only | Prisma CLI (`db:studio`, `db:push`, etc.) |

**Both are gitignored** - safe from commits!

---

## For Vercel Deployment

Vercel **doesn't use these files**. You must set environment variables in:
- Vercel Dashboard → Project Settings → Environment Variables

Required variables:
- `DATABASE_URL`
- `GROQ_API_KEY`
- `UPSTASH_VECTOR_REST_URL`
- `UPSTASH_VECTOR_REST_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

All set for: **Production**, **Preview**, **Development**
