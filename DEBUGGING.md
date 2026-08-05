# Debugging Guide - v1.2.4

## Quick Health Check

Check if all systems are working:
```bash
curl http://localhost:3000/api/debug/health
```

This endpoint checks:
- ✅ Environment variables are set
- ✅ Database connectivity
- ✅ All required tables exist

## Testing Answer Grading

Test the grading pipeline:
```bash
curl -X POST http://localhost:3000/api/debug/test-grading \
  -H "Content-Type: application/json" \
  -d '{
    "question": "מה הוא מהירות מקסימלית בעיר?",
    "correctAnswer": "50 קמ״ש",
    "userAnswer": "מהירות מקסימלית היא 50 קמ״ש בעיר"
  }'
```

This will show:
- ✅ Grading result (verdict, feedback, metrics)
- ✅ Time taken to grade
- ✅ Any errors during the process

## Voice Input Issues

### Problem: Voice button not showing
**Check:**
1. Browser supports Web Speech API (Chrome, Edge, Safari)
2. Check browser console for errors
3. Verify microphone permissions are granted

### Problem: Voice input not capturing
**Debug:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for "Speech recognition error" messages
4. Verify microphone is working with browser speech recognition test

### Problem: Voice results not appearing in textarea
**Check:**
1. Browser Speech API implementation (onresult handler)
2. Check if language is set to 'he-IL'
3. Verify speech recognition is being initialized

## Answer Evaluation Issues

### Problem: Grading returns error
**Steps:**
1. Run the `/api/debug/test-grading` endpoint
2. Check error message in response
3. Common issues:
   - No GEMINI_API_KEY set
   - RAG documents not loaded
   - API quota exceeded
   - Network timeout

### Problem: Test attempts not saved to database
**Check:**
1. User is authenticated (session cookie exists)
2. Database connection is working (`/api/debug/health`)
3. `test_attempts` table exists and has correct schema

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT (user|admin|super_admin),
  location TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP,
  last_login TIMESTAMP,
  theme TEXT (light|dark|auto),
  show_answers BOOLEAN
);
```

### Test Attempts Table
```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (references users),
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  input_method TEXT (typed|voice),
  verdict TEXT (correct|partial|incorrect),
  metrics JSONB,
  feedback TEXT,
  created_at TIMESTAMP
);
```

### RAG Documents Table
```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_by UUID (references users),
  created_at TIMESTAMP
);
```

### Debug Logs Table
```sql
CREATE TABLE debug_logs (
  id UUID PRIMARY KEY,
  level TEXT (info|warn|error),
  source TEXT,
  message TEXT,
  context JSONB,
  created_at TIMESTAMP
);
```

## Environment Variables Check

Required for full functionality:
```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role (server-side only)
GOOGLE_CLIENT_ID=                 # Google OAuth Client ID
GOOGLE_CLIENT_SECRET=             # Google OAuth Client Secret
JWT_SECRET=                        # Session token signing key
GEMINI_API_KEY=                   # Google Gemini API key
NEXT_PUBLIC_APP_URL=              # App URL (http://localhost:3000 or Vercel URL)
```

## Common Errors

### "Failed to grade answer"
**Cause:** Grading timeout or Gemini API error
**Fix:**
1. Check GEMINI_API_KEY is set
2. Check Gemini API quota on Google Cloud Console
3. Check network connectivity
4. Wait 1 minute for rate limit to reset

### "Not authenticated"
**Cause:** Session cookie missing or invalid
**Fix:**
1. Log in again to generate new session
2. Check browser cookies (DevTools > Application > Cookies)
3. Verify JWT_SECRET is set on server

### "Failed to save test attempt"
**Cause:** Database error
**Fix:**
1. Run `/api/debug/health` to check database
2. Verify user_id exists in users table
3. Check test_attempts table permissions

### Voice button not showing
**Cause:** Browser doesn't support Web Speech API
**Fix:**
1. Use Chrome, Edge, or Safari (Firefox doesn't support consistently)
2. On iOS Safari: Unavailable, fallback to typing
3. On mobile: Check browser supports Speech API (useEffect hook detects)

## Performance Tips

1. **RAG Document Retrieval:** Takes 1-2 seconds (depends on Gemini API)
2. **Feedback Generation:** Takes 2-5 seconds (depends on Gemini API)
3. **Total Grading Time:** 3-7 seconds typical, up to 25 seconds max

## Testing Checklist

- [ ] `/api/debug/health` returns all green
- [ ] Voice button appears in test input (on Chrome/Safari)
- [ ] Voice input captures speech properly
- [ ] Grading completes within 25 seconds
- [ ] Test attempt saved to database
- [ ] Verdict displayed correctly
- [ ] Metrics shown in result

## Support

For detailed logs:
1. Check `/api/debug/health` output
2. Check browser Console for errors
3. Check Supabase dashboard for database issues
4. Check Google Cloud Console for API quota/errors
