This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


## Project Operations & Deployment Guide

### Analytics Dashboard
- Tracks user questions, AI responses, RAG metrics, mood/personality, and frequent questions.
- **View in Prisma Studio:**
	```bash
	pnpm db:studio
	# Opens at http://localhost:5555
	```
- **Direct SQL (Neon):**
	```sql
	SELECT question, count, category, "lastAsked" FROM "FrequentQuestion" ORDER BY count DESC LIMIT 20;
	SELECT "userQuery", mood, "chunksUsed", "topScore", timestamp FROM "ChatLog" ORDER BY timestamp DESC LIMIT 50;
	```

### Vercel Environment Setup
- Add these to Vercel project settings:
	- `DATABASE_URL` (from your .env.local)
	- `GROQ_API_KEY`
	- `UPSTASH_VECTOR_REST_URL`
- Set for Production, Preview, and Development.

### Prisma & Database Info
- Data is stored in **Neon Postgres** (cloud, not local).
- `DATABASE_URL` is in `.env.local` (never commit this file).
- Data is always accessible and persists across deployments.
- **View with:**
	```bash
	pnpm db:studio
	# or use Neon Console: https://console.neon.tech
	```

### .env Files Explained
- `.env` — For Prisma CLI only (db connection for migrations, studio)
- `.env.local` — For Next.js app (all secrets: GROQ, Upstash, Neon, etc.)
- Both are gitignored.

---
For more, see `agents.md` for project setup and AI configuration details.
