# Chat Conversation Logging Implementation Plan

## Overview
Implement a system to record all chat conversations (requests and responses) when users interact with the AI chat functionality. Data will be stored in a database with server actions handling all database operations.

## Database Schema

### Table: `chat_conversations`
```sql
CREATE TABLE chat_conversations (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  mood VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  user_ip VARCHAR(45),
  user_agent TEXT,
  response_time_ms INTEGER,
  metadata JSONB
);

CREATE INDEX idx_session_id ON chat_conversations(session_id);
CREATE INDEX idx_timestamp ON chat_conversations(timestamp);
```

### Table: `chat_sessions`
```sql
CREATE TABLE chat_sessions (
  id VARCHAR(255) PRIMARY KEY,
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  total_messages INTEGER DEFAULT 0,
  metadata JSONB
);
```

## Implementation Steps

### 1. Database Setup
- [ ] Create database tables using Neon/PostgreSQL (use Neon console or SQL queries)
- [ ] Set up database connection in environment variables
- [ ] Create database connection utility

### 2. Database Connection Utility (`lib/db.ts`)

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export { sql }
```

### 3. Server Actions (`app/actions/chat-logging-actions.ts`)

Create server actions for:
- `logChatMessage()` - Log a single chat interaction
- `createChatSession()` - Initialize a new chat session
- `updateChatSession()` - Update session activity
- `getChatHistory()` - Retrieve conversation history
- `getSessionStats()` - Get session statistics

```typescript
'use server'

import { sql } from '@/lib/db'
import { headers } from 'next/headers'

export async function logChatMessage({
  sessionId,
  userMessage,
  aiResponse,
  mood,
  responseTimeMs,
  metadata
}: {
  sessionId: string
  userMessage: string
  aiResponse: string
  mood?: string
  responseTimeMs?: number
  metadata?: any
}) {
  const headersList = await headers()
  const userIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
  const userAgent = headersList.get('user-agent')

  try {
    // Log the conversation
    const result = await sql`
      INSERT INTO chat_conversations (
        session_id, user_message, ai_response, mood, 
        user_ip, user_agent, response_time_ms, metadata
      )
      VALUES (
        ${sessionId}, ${userMessage}, ${aiResponse}, ${mood},
        ${userIp}, ${userAgent}, ${responseTimeMs}, ${JSON.stringify(metadata)}
      )
      RETURNING id
    `

    // Update session
    await sql`
      UPDATE chat_sessions
      SET last_activity = NOW(),
          total_messages = total_messages + 1
      WHERE id = ${sessionId}
    `

    return { success: true, conversationId: result[0].id }
  } catch (error) {
    console.error('Error logging chat message:', error)
    return { success: false, error: 'Failed to log message' }
  }
}

export async function createChatSession(sessionId: string, metadata?: any) {
  try {
    await sql`
      INSERT INTO chat_sessions (id, metadata)
      VALUES (${sessionId}, ${JSON.stringify(metadata)})
      ON CONFLICT (id) DO NOTHING
    `
    return { success: true, sessionId }
  } catch (error) {
    console.error('Error creating chat session:', error)
    return { success: false, error: 'Failed to create session' }
  }
}

export async function getChatHistory(sessionId: string, limit = 50) {
  try {
    const conversations = await sql`
      SELECT id, session_id, user_message, ai_response, mood, 
             timestamp, response_time_ms, metadata
      FROM chat_conversations
      WHERE session_id = ${sessionId}
      ORDER BY timestamp ASC
      LIMIT ${limit}
    `
    return { success: true, conversations }
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return { success: false, error: 'Failed to fetch history' }
  }
}

export async function getSessionStats(sessionId: string) {
  try {
    const stats = await sql`
      SELECT 
        s.total_messages,
        s.started_at,
        s.last_activity,
        COUNT(c.id) as conversation_count,
        AVG(c.response_time_ms) as avg_response_time
      FROM chat_sessions s
      LEFT JOIN chat_conversations c ON s.id = c.session_id
      WHERE s.id = ${sessionId}
      GROUP BY s.id, s.total_messages, s.started_at, s.last_activity
    `
    return { success: true, stats: stats[0] }
  } catch (error) {
    console.error('Error fetching session stats:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}

export async function initializeDatabaseTables() {
  try {
    // Create chat_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        started_at TIMESTAMP DEFAULT NOW(),
        last_activity TIMESTAMP DEFAULT NOW(),
        total_messages INTEGER DEFAULT 0,
        metadata JSONB
      )
    `

    // Create chat_conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        mood VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW(),
        user_ip VARCHAR(45),
        user_agent TEXT,
        response_time_ms INTEGER,
        metadata JSONB
      )
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_id 
      ON chat_conversations(session_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_timestamp 
      ON chat_conversations(timestamp)
    `

    return { success: true }
  } catch (error) {
    console.error('Error initializing database tables:', error)
    return { success: false, error: 'Failed to initialize tables' }
  }
}
```

### 4. Integration with Chat API (`app/api/chat/route.ts`)

Modify the chat API to:
- Generate/retrieve session ID
- Log each conversation
- Track response time
- Handle errors gracefully

```typescript
import { logChatMessage, createChatSession } from '@/app/actions/chat-logging-actions'

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    const { message, sessionId, mood } = await req.json()
    
    // Ensure session exists
    if (!sessionId) {
      const newSessionId = generateSessionId()
      await createChatSession(newSessionId)
    }
    
    // Process AI response (existing logic)
    const aiResponse = await processAIChat(message, mood)
    
    const responseTimeMs = Date.now() - startTime
    
    // Log the conversation
    await logChatMessage({
      sessionId,
      userMessage: message,
      aiResponse,
      mood,
      responseTimeMs,
      metadata: {
        // Add any additional context
      }
    })
    
    return Response.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat error:', error)
    return Response.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
```

### 5. Session Management (`lib/session-manager.ts`)

Create utilities for:
- Generating unique session IDs
- Managing session lifecycle
- Cleaning up old sessions

```typescript
import { v4 as uuidv4 } from 'uuid'

export function generateSessionId(): string {
  return `session_${uuidv4()}_${Date.now()}`
}

export function getSessionIdFromCookie(): string | null {
  // Retrieve from cookie or localStorage
  return null
}

export function setSessionIdInCookie(sessionId: string): void {
  // Store in cookie or localStorage
}
```

### 6. Client-Side Integration

Update chat components to:
- Initialize session on first load
- Pass session ID with each request
- Handle session persistence

```typescript
// In chat component
const [sessionId, setSessionId] = useState<string>(() => {
  // Try to get existing session
  const existing = localStorage.getItem('chat_session_id')
  if (existing) return existing
  
  // Create new session
  const newId = `session_${crypto.randomUUID()}_${Date.now()}`
  localStorage.setItem('chat_session_id', newId)
  return newId
})
```

## Environment Variables

Add to `.env.local`:
```env
DATABASE_URL="postgresql://..."
ENABLE_CHAT_LOGGING=true
CHAT_LOG_RETENTION_DAYS=90
```

## Additional Features (Optional)

### Analytics & Reporting
- [ ] Dashboard to view chat statistics
- [ ] Most common questions
- [ ] Response time analytics
- [ ] User engagement metrics

### Privacy & Compliance
- [ ] Add data retention policies
- [ ] Implement user data deletion
- [ ] GDPR compliance considerations
- [ ] Option to anonymize IP addresses

### Performance Optimization
- [ ] Batch logging for high-traffic scenarios
- [ ] Use Redis for temporary storage before DB write
- [ ] Implement cleanup cron job for old conversations

## Testing Checklist

- [ ] Test session creation
- [ ] Test message logging
- [ ] Test concurrent requests
- [ ] Test error handling
- [ ] Test session persistence
- [ ] Test database performance under load
- [ ] Test privacy controls

## Dependencies

```json
{
  "@neondatabase/serverless": "latest"
}
```

## Installation Commands

```bash
# Install Neon serverless driver
pnpm add @neondatabase/serverless

# Initialize database tables (one-time setup)
# Create a script or API endpoint that calls initializeDatabaseTables()
```


## Database Initialization

Option 1: Run SQL directly in Neon console
Option 2: Create an API endpoint to initialize tables:

```typescript
// app/api/init-db/route.ts
import { initializeDatabaseTables } from '@/app/actions/chat-logging-actions'

export async function POST() {
  const result = await initializeDatabaseTables()
  return Response.json(result)
}
```

Then call: `curl -X POST http://localhost:3000/api/init-db`

## Security Considerations

1. **Sanitize user input** before storing
2. **Rate limiting** to prevent abuse
3. **Encrypt sensitive data** if needed
4. **Access controls** for viewing logs
5. **IP anonymization** for privacy

## Rollout Plan

1. **Phase 1**: Database setup and schema creation
2. **Phase 2**: Server actions implementation
3. **Phase 3**: API integration
4. **Phase 4**: Client-side session management
5. **Phase 5**: Testing and validation
6. **Phase 6**: Deploy to production
7. **Phase 7**: Monitor and optimize

## Success Metrics

- All chat interactions logged successfully
- Response time < 50ms overhead for logging
- Zero data loss
- Session persistence works across page reloads
- Database queries optimized (< 100ms average)
