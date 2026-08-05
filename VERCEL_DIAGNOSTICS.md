# Vercel Answer Evaluation Diagnostics

## Why Answer Evaluation Fails on Vercel

### Most Common Causes (in order):

1. **Missing Environment Variables** ⚠️ **MOST LIKELY**
   - `GEMINI_API_KEY` not set in Vercel
   - `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel
   - `JWT_SECRET` not set correctly

2. **Gemini API Rate Limiting**
   - Free tier has ~60 requests/minute
   - Multiple simultaneous grading requests exceed limit

3. **Supabase Database Issues**
   - Service role key doesn't have permissions
   - Database connection timeout
   - test_attempts table doesn't exist

4. **Network/Timeout Issues**
   - Gemini API call timing out
   - RAG document retrieval slow
   - Total grading exceeds 25 seconds

## Step-by-Step Diagnostics

### 1. Check Vercel Logs

On Vercel Dashboard:
- Go to your project → Deployments → Latest → Logs
- Search for `[EVALUATE]` tags to see grading flow
- Look for error messages with `ERROR` tag

### 2. Check Environment Variables on Vercel

Vercel Dashboard → Project Settings → Environment Variables

Verify these are SET:
```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY    ← CRITICAL
✓ GOOGLE_CLIENT_ID
✓ GOOGLE_CLIENT_SECRET
✓ JWT_SECRET
✓ GEMINI_API_KEY               ← CRITICAL
✓ NEXT_PUBLIC_APP_URL
```

### 3. Run Health Check

```bash
curl https://your-app.vercel.app/api/debug/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": {
    "supabaseUrl": true,
    "supabaseKey": true,
    "supabaseServiceRole": true,
    "jwtSecret": true,
    "geminiApiKey": true
  },
  "database": {
    "connected": true,
    "tables": {
      "users": true,
      "test_attempts": true,
      "rag_documents": true
    }
  }
}
```

If any are `false`, that's your problem!

### 4. Test Grading Endpoint Directly

```bash
curl -X POST https://your-app.vercel.app/api/debug/test-grading \
  -H "Content-Type: application/json" \
  -d '{
    "question": "מה הוא מהירות מקסימלית בעיר?",
    "correctAnswer": "50 קמ״ש",
    "userAnswer": "מהירות מקסימלית היא 50 קמ״ש"
  }'
```

Expected response:
```json
{
  "success": true,
  "duration": "2500ms",
  "result": {
    "verdict": "correct",
    "feedback": "תשובה נכונה!",
    "metrics": {...}
  }
}
```

### 5. Read Vercel Logs During Grading

Trigger grading from browser and watch Vercel logs:

Look for these log lines (in order):
```
[EVALUATE] Starting evaluation request
[EVALUATE] User authenticated: <user-id>
[EVALUATE] Validating environment variables...
[GRADING] Starting with question: ...
[RAG] Retrieving documents for query: ...
[GEMINI] Embedding text, length: ...
[GEMINI] Generating answer...
[EVALUATE] Saving test attempt to database...
[EVALUATE] Success! Completed in <duration>ms
```

If logs stop at one point, that's where it's failing!

## Common Error Messages & Fixes

### Error: "Server configuration error: Missing GEMINI_API_KEY"
**Fix:** Add `GEMINI_API_KEY` to Vercel Environment Variables
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add variable: `GEMINI_API_KEY` = your Gemini API key
3. Redeploy (automatic when you save)

### Error: "Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY"
**Fix:** Add service role key to Vercel
1. Get key from Supabase Dashboard → Project Settings → API
2. Copy "service_role" key (NOT anon key)
3. Add to Vercel: `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy

### Error: "Grading timeout after 25 seconds"
**Causes:**
- Gemini API is slow (rate limited)
- RAG retrieval taking too long
- No documents in RAG database

**Fixes:**
- Check Gemini API quota
- Add RAG documents (they speed up feedback generation)
- Check network latency (Vercel region vs. API endpoints)

### Error: "Failed to save test attempt: ..."
**Cause:** Database insert failed
**Debug:**
1. Check test_attempts table exists in Supabase
2. Verify columns: user_id, question_id, user_answer, verdict, feedback, metrics
3. Check user_id actually exists in users table

### Error: "No text response from Gemini"
**Cause:** Gemini API returned invalid response
**Fixes:**
- Check GEMINI_API_KEY is correct
- Check Gemini API quota on Google Cloud Console
- Check account billing is active
- Wait 1 minute (rate limit recovery)

## Performance Benchmarks (What's Normal)

```
[EVALUATE] Starting evaluation request
          ↓ (instant - session lookup)
[EVALUATE] User authenticated: ...
          ↓ (instant - env check)
[EVALUATE] Validating environment variables...
          ↓ (100-200ms - embedding)
[GEMINI] Embedding successful
          ↓ (500-1000ms - RPC query)
[RAG] RPC returned 5 documents
          ↓ (2000-4000ms - Gemini generation)
[GEMINI] Generated answer length: ...
          ↓ (500-1000ms - RAGAS evaluation)
[GRADING] Metrics computed: ...
          ↓ (500-1000ms - DB insert)
[EVALUATE] Success! Completed in 3500-7000ms
```

**If slower:** Gemini API rate limiting or network latency

## Checking Gemini API Status

1. **Google Cloud Console:**
   - Go to Cloud Console → APIs & Services → "Generative AI API"
   - Check quota usage
   - Check if billing is enabled

2. **Rate Limits:**
   - Free tier: ~60 requests/minute
   - Each grading = 2 API calls (embedding + generation)
   - Max ~30 gra dings/minute

3. **Test Gemini Directly:**
   ```bash
   # From server-side code, check if GEMINI_API_KEY works
   curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

## Supabase Diagnostics

1. **Check Service Role Permissions:**
   - Go to Supabase Dashboard → Authentication → Row Level Security
   - All tables should have policies that allow service_role
   - Verify service_role key matches what's in Vercel

2. **Check Table Exists:**
   - Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM test_attempts LIMIT 1;`
   - Should return empty result set (not error)

3. **Check Embedding Column:**
   - Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='rag_documents';`
   - Should include: `embedding | vector`

## Next Steps

1. **Get Vercel Logs:**
   - Save full logs during a failed grading attempt
   - Look for `[EVALUATE]` tags
   - Identify exactly where it stops

2. **Run Health Check:**
   ```bash
   curl https://your-app.vercel.app/api/debug/health
   ```
   - Note any `false` values

3. **Run Grading Test:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/debug/test-grading \
     -H "Content-Type: application/json" \
     -d '{"question":"test","correctAnswer":"test","userAnswer":"test"}'
   ```
   - Note error message if it fails

4. **Share:**
   - Vercel log excerpt showing the error
   - Health check output
   - Grading test output

This will pinpoint exactly where the failure occurs!
