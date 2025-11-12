# Analytics Setup Guide

## Overview
Track user questions and AI responses to improve your digital twin over time.

## Setup Steps

### 1. Set up Neon Postgres Database
1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://...your-connection-string
   ```

### 2. Set Admin Secret Key
Add a strong random password to `.env.local`:
```
ADMIN_SECRET_KEY=your-super-secret-key-here-use-random-generator
```

**Security:** This key protects your analytics dashboard. Keep it secret!

### 3. Enable Analytics
In `.env.local`:
```
ENABLE_ANALYTICS=true
```

### 4. Initialize Database
```bash
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Create database tables
```

### 5. Access Analytics Dashboard
Navigate to: `http://localhost:3000/admin/analytics`

Enter your `ADMIN_SECRET_KEY` to view:
- **Most frequent questions** - See what users ask most
- **Recent chats** - Review conversation history
- **Mood distribution** - Professional vs GenZ mode usage
- **RAG performance** - Vector search quality metrics

## Security Features
- ✅ Password-protected admin page
- ✅ No public access - requires secret key
- ✅ No user data exposed in public APIs
- ✅ Analytics API uses Node.js runtime (not Edge) for security
- ✅ Non-blocking logging - doesn't slow down chat responses

## Database Schema

### ChatAnalytics
- User queries and AI responses
- RAG metrics (chunks used, relevance scores)
- Feedback tracking
- Response times

### FrequentQuestions
- Question text
- Category (projects, skills, experience, etc.)
- Count and last asked timestamp

## Optional: View Database
```bash
pnpm db:studio
```
Opens Prisma Studio to browse your data visually.

## Disabling Analytics
Set in `.env.local`:
```
ENABLE_ANALYTICS=false
```

Analytics will stop logging but existing data remains accessible.
