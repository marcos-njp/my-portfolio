# Quick Fixes for Better MCP Responses

## Problem: MCP Responses Don't Use Vector Database Well

### Issue 1: Score Threshold Too High ⚠️
**Location:** `app/api/chat/route.ts` line ~217

**Current:**
```typescript
const ragContext = await searchVectorContext(vectorIndex, enhancedQuery, {
  topK: 2,
  minScore: 0.75,  // 75% - TOO STRICT!
  includeMetadata: true,
});
```

**Fix:**
```typescript
const ragContext = await searchVectorContext(vectorIndex, enhancedQuery, {
  topK: 3,          // Get more context
  minScore: 0.6,    // 60% - balanced threshold
  includeMetadata: true,
});
```

**Why:** 0.75 (75%) threshold was rejecting too much good context. 0.6 (60%) provides a good balance between quality and coverage.

---

### Issue 2: System Prompt Too Complicated ⚠️
**Location:** `app/api/chat/route.ts` line ~60

**Current Issues:**
- Too many security rules
- Conflicting length guidelines
- AI gets confused between "be concise" and "give specific answers"

**Simplified Prompt:**
```typescript
const SYSTEM_PROMPT = `You are Niño Marcos's digital twin. Answer questions about his professional background using the PROVIDED CONTEXT.

CORE RULES:
1. Use context to give SPECIFIC answers with real examples
2. Keep responses 2-4 sentences (elaborate only for complex questions)
3. Answer AS Niño using "I", "my", "me"
4. If genuinely missing info: "I don't have that specific detail, but I can tell you about [related topic]"
5. Be natural, confident, and helpful

STYLE: Professional but conversational. Specific over generic.`;
```

---

### Issue 3: Too Many Preprocessing Steps
**Location:** `app/api/chat/route.ts` lines 195-265

**Current Flow:**
1. Validate query → 2. Check FAQ → 3. Enhance query → 4. Vector search → 5. Fallback logic

**Problem:** Each step can filter out good responses or add confusion

**Recommendation:** Trust the vector database more. The data in `digitaltwin.json` is already comprehensive.

---

## Implementation Priority

### Phase 1: Quick Wins (30 minutes)
1. ✅ Lower minScore from 0.75 to 0.5
2. ✅ Increase topK from 2 to 3
3. ✅ Simplify system prompt

### Phase 2: Testing (1 hour)
1. Test with common questions:
   - "What projects have you built?"
   - "Tell me about your experience"
   - "What are your technical skills?"
   - "Why should we hire you?"

2. Check Vercel logs for:
   - RAG score metrics
   - Chunks used
   - Response quality

### Phase 3: Monitor (Ongoing)
- Check if responses mention specific projects (Person Search, AI Portfolio)
- Verify responses use STAR format achievements
- Ensure responses don't say "I don't know" when data exists

---

## How to Test

1. **Deploy changes:**
```bash
git add .
git commit -m "fix: lower RAG threshold and simplify prompt"
git push
```

2. **Test via MCP:**
Ask these questions and check if responses are specific:
- "What can you do for the company?"
- "Tell me about your projects"
- "What's your experience with Next.js?"
- "What makes you unique?"

3. **Check Vercel logs:**
Look for lines like:
```
[RAG Metrics] Query: "..." | Chunks: 2 | Avg Score: 65.0% | Top Score: 72.0%
```

If Chunks = 0 often, threshold is still too high.

---

## Expected Results

### Before Fix:
- Chunks used: 0-1 (vector DB barely used)
- Generic responses
- Often says "I don't know"

### After Fix:
- Chunks used: 2-3 consistently
- Specific mentions of projects (Person Search, AI Portfolio, RAG system)
- References to achievements (4th place, 118 teams)
- Uses numbers and details from digitaltwin.json

---

## Notes

- The vector database (`digitaltwin.json`) has 38 rich chunks covering everything from projects to personality
- Current setup is too defensive - it's rejecting good context
- Simpler is better - trust the RAG system, don't overthink it
