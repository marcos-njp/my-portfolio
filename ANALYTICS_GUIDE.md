# Analytics Dashboard - View User Questions

## 📊 What Gets Tracked

Your Neon Postgres database now tracks:
- **User Questions** - What users ask the AI
- **AI Responses** - How the digital twin responds
- **RAG Metrics** - How many chunks were used, relevance scores
- **Mood/Personality** - Professional vs GenZ mode usage
- **Frequent Questions** - Most common questions with counts

## 🎯 How to View Analytics

### Option 1: Prisma Studio (Visual Dashboard)
```powershell
pnpm db:studio
```

This opens a beautiful web interface at `http://localhost:5555` where you can:
- ✅ View all `ChatLog` entries (user questions + AI responses)
- ✅ See `FrequentQuestion` table (most asked questions ranked by count)
- ✅ Filter, search, and sort all data
- ✅ No code required!

### Option 2: Direct SQL Queries (Advanced)

Connect to Neon and run SQL:

```sql
-- Most frequently asked questions
SELECT question, count, category, "lastAsked"
FROM "FrequentQuestion"
ORDER BY count DESC
LIMIT 20;

-- Recent chat interactions
SELECT "userQuery", mood, "chunksUsed", "topScore", timestamp
FROM "ChatLog"
ORDER BY timestamp DESC
LIMIT 50;

-- Mood usage distribution
SELECT mood, COUNT(*) as uses
FROM "ChatLog"
GROUP BY mood;

-- Best RAG performance
SELECT "userQuery", "topScore", "chunksUsed"
FROM "ChatLog"
WHERE "topScore" > 0.8
ORDER BY "topScore" DESC;
```

## 🔧 Database Schema

### ChatLog Table
```
- id: unique identifier
- sessionId: user session ID
- userQuery: what the user asked
- aiResponse: what the AI responded
- mood: "professional" or "genz"
- chunksUsed: number of RAG chunks retrieved
- topScore: highest relevance score (0-1)
- avgScore: average relevance score
- timestamp: when the chat happened
```

### FrequentQuestion Table
```
- id: unique identifier
- question: the question text
- category: projects | skills | experience | education | general
- count: how many times asked
- lastAsked: most recent timestamp
```

## 📈 Useful Insights You Can Get

1. **What do users care about most?**
   - Check FrequentQuestion sorted by count

2. **Is the RAG working well?**
   - Look at topScore and avgScore in ChatLog
   - Scores > 0.75 = good retrieval quality

3. **Which personality mode is more popular?**
   - Count ChatLog by mood field

4. **What questions get poor RAG results?**
   - Filter ChatLog where topScore < 0.5
   - These might need better content chunks

## 🚀 Quick Start

```powershell
# 1. View analytics in browser
pnpm db:studio

# 2. Open http://localhost:5555

# 3. Click "ChatLog" to see all chats

# 4. Click "FrequentQuestion" to see popular questions
```

## ⚠️ Important Notes

- Analytics logging is **non-blocking** - won't slow down chat
- If database is down, chat still works (graceful failure)
- `.env` file has DATABASE_URL for Prisma CLI
- `.env.local` also has DATABASE_URL for Next.js app
- Both files are gitignored for security

## 🔒 Security

Your DATABASE_URL contains credentials - **never commit** `.env` or `.env.local` to Git!
