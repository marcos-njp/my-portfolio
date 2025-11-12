# Analytics Setup (Simple!)

## What it does
Logs user questions to a database so you can see what people ask and improve your AI responses.

## Quick Setup

### 1. Get Neon Postgres (free)
1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://...your-connection-string
   ENABLE_ANALYTICS=true
   ```

### 2. Initialize Database
```bash
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Create tables
```

### 3. View Analytics
```bash
pnpm db:studio     # Opens Prisma Studio in browser
```

Prisma Studio shows:
- **ChatAnalytics** - All user questions, AI responses, RAG scores, response times
- **FrequentQuestions** - Most asked questions with counts

That's it! No complex dashboards, no passwords, just simple database logging.

## Turn it off
Set in `.env.local`:
```
ENABLE_ANALYTICS=false
```
