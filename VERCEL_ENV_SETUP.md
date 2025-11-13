# 🚨 FIX: Analytics Not Recording on Vercel

## Problem
- ✅ Local dev (`pnpm run dev`) → Records to Neon ✅
- ❌ Vercel production → Does NOT record ❌

## Root Cause
**Missing `DATABASE_URL` environment variable in Vercel!**

Your Prisma client needs this to connect to Neon Postgres on production.

---

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/marcos-njps-projects
2. Click on your project: **my-portfolio**
3. Go to: **Settings** → **Environment Variables**

### Step 2: Add Required Variables

Add these **exact** environment variables to Vercel:

#### 1. DATABASE_URL (CRITICAL!)
```
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require
```
- **Environments:** Production, Preview, Development (select all 3)
- **Source:** Copy from your `.env.local` file
- **Why:** Prisma needs this to connect to Neon database

#### 2. GROQ_API_KEY
```
GROQ_API_KEY=[your-groq-api-key]
```
- **Environments:** Production, Preview, Development

#### 3. UPSTASH_VECTOR_REST_URL
```
UPSTASH_VECTOR_REST_URL=[your-upstash-vector-url]
```

#### 4. UPSTASH_VECTOR_REST_TOKEN
```
UPSTASH_VECTOR_REST_TOKEN=[your-upstash-vector-token]
```

#### 5. UPSTASH_REDIS_REST_URL
```
UPSTASH_REDIS_REST_URL=[your-upstash-redis-url]
```

#### 6. UPSTASH_REDIS_REST_TOKEN
```
UPSTASH_REDIS_REST_TOKEN=[your-upstash-redis-token]
```

### Step 3: Redeploy
After adding `DATABASE_URL`:
1. Go to **Deployments** tab
2. Click **...** (three dots) on the latest deployment
3. Click **Redeploy**
4. ✅ Analytics will start recording!

---

## How to Verify It's Working

### Check Vercel Logs
1. Go to **Deployments** → Click on latest deployment
2. Click **View Function Logs**
3. Ask a question on https://m-njp.vercel.app/
4. You should see:
   ```
   [Analytics] 📤 Sending to: https://m-njp.vercel.app/api/analytics/log
   [Analytics API] 📝 Received request: ...
   [Analytics API] ✅ Successfully logged to database
   [Analytics] ✅ Logged successfully to database
   ```

### Check Neon Console
1. Go to https://console.neon.tech
2. Select your project
3. Click **Tables** → **ChatLog**
4. You should see new entries from Vercel production!

---

## Common Issues

### ❌ "PrismaClient is unable to connect"
**Fix:** Make sure `DATABASE_URL` includes `?sslmode=require` at the end

### ❌ "Environment variable not found: DATABASE_URL"
**Fix:** Redeploy after adding the environment variable

### ❌ Still not recording
**Check:**
1. Is `DATABASE_URL` set for **Production** environment?
2. Did you redeploy after adding it?
3. Check Vercel function logs for errors

---

## Quick Checklist

- [ ] Copy `DATABASE_URL` from `.env.local`
- [ ] Add to Vercel Environment Variables (Production, Preview, Development)
- [ ] Add all other variables (GROQ, UPSTASH)
- [ ] Redeploy the latest deployment
- [ ] Test by asking a question on https://m-njp.vercel.app/
- [ ] Check Vercel function logs for ✅ success messages
- [ ] Verify data in Neon Console

**After this, analytics will work on production!** 🎉
