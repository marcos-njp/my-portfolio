# Vercel Deployment Guide

## 🚨 CRITICAL: Environment Variables Required

**The AI chat will NOT work on Vercel without these environment variables!**

### Required Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables** and add:

#### 1. Groq AI API Key
```
GROQ_API_KEY=your_groq_api_key_here
```
- Get from: https://console.groq.com/keys
- Required for AI chat responses

#### 2. Upstash Vector Database
```
UPSTASH_VECTOR_REST_URL=your_vector_url_here
UPSTASH_VECTOR_REST_TOKEN=your_vector_token_here
```
- Get from: https://console.upstash.com/vector
- Required for RAG (semantic search)

#### 3. Upstash Redis (for session memory)
```
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```
- Get from: https://console.upstash.com/redis
- Required for conversation history

---

## ✅ Deployment Steps

### 1. Set Environment Variables
1. Copy values from your local `.env.local`
2. Go to Vercel Dashboard → Settings → Environment Variables
3. Add each variable for **Production**, **Preview**, and **Development**
4. Click "Save"

### 2. Redeploy
After adding environment variables:
```bash
git push origin main
```
Or manually redeploy from Vercel Dashboard

### 3. Verify Deployment
1. Open your deployed site
2. Click the AI chat button
3. Try asking: "Tell me about yourself"
4. **Expected**: AI responds with professional or GenZ tone (based on mode)
5. **If it fails**: Check Vercel Function Logs for error messages

---

## 🐛 Troubleshooting

### Issue: AI doesn't respond at all
**Likely cause**: Missing environment variables

**Fix**:
1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure all 5 variables are set
3. Redeploy the project

### Issue: "Server configuration error"
**Likely cause**: One or more env variables are missing

**Fix**:
1. Check Vercel Function Logs (Runtime Logs)
2. Look for messages like `❌ GROQ_API_KEY missing`
3. Add the missing variable and redeploy

### Issue: GenZ mode not working
**Likely cause**: This was fixed in commit `a856858`

**Fix**:
1. Ensure you're deploying the latest commit
2. Check that mood selector shows "🔥 GenZ Mode"
3. Verify browser console shows: `[Mood Change] New mood: genz`

---

## 📊 Monitoring

### Check Function Logs
1. Vercel Dashboard → Your Project → Logs
2. Filter by "Runtime Logs"
3. Look for:
   - `[AI Generation] Mood: genz, Temperature: 0.9`
   - `❌ GROQ_API_KEY missing` (bad)
   - `✅ .env.local exists locally` (should NOT appear on Vercel)

### Check Browser Console
1. Open deployed site
2. Press F12 → Console
3. Look for:
   - `[API Call] 🚀 Sending query:`
   - `[Response Complete]`
   - Any error messages

---

## 🔧 Local vs Production

### Local Development
- Uses `.env.local` file
- Environment variables loaded automatically
- Hot reload works

### Vercel Production
- Uses environment variables from Vercel Dashboard
- `.env.local` is NOT deployed (ignored by `.gitignore`)
- Must manually set each variable in dashboard

---

## 📝 Verification Checklist

Before deploying, ensure:

- [ ] All 5 environment variables are set in Vercel Dashboard
- [ ] Variables are set for Production, Preview, AND Development
- [ ] Latest code is pushed to GitHub
- [ ] Build succeeds locally: `pnpm build`
- [ ] AI chat works locally: `pnpm dev`

After deploying:

- [ ] AI chat loads without errors
- [ ] Professional mode works
- [ ] GenZ mode uses slang (no cap, fr fr, etc.)
- [ ] Session memory persists across page refresh
- [ ] Error messages are clear (not generic "Failed to generate response")

---

## 🆘 Still Having Issues?

1. **Check Vercel Function Logs** - Most errors will be logged there
2. **Verify API keys are valid** - Test them locally first
3. **Check Upstash dashboard** - Ensure Vector DB has 25 embedded chunks
4. **Clear browser cache** - Sometimes old code is cached
5. **Redeploy from scratch** - Delete project and redeploy

---

## 🚀 Quick Deploy Checklist

```bash
# 1. Ensure environment variables are set in Vercel Dashboard
# 2. Build locally to verify
pnpm build

# 3. Commit changes
git add .
git commit -m "Deploy fixes"

# 4. Push to GitHub (triggers Vercel deployment)
git push origin main

# 5. Wait for deployment (check Vercel Dashboard)
# 6. Test on production URL
# 7. Check Function Logs if issues occur
```

---

**Last Updated**: After commit `a856858` - GenZ mode fixes and error handling improvements
