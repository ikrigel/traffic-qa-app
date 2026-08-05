# API Key Architecture - Multi-Provider Support

## Problem with Current Approach
❌ Single shared API key = quota exhausted quickly with multiple users
❌ Not scalable for production
❌ Security risk if key is exposed

## New Architecture

### 1. Per-User API Keys
Each user (or admin) provides their own API key:
- Stored encrypted in database
- Users can add/rotate their own keys
- No quota sharing between users
- Better security isolation

### 2. Multi-Provider Support
Support multiple AI providers:
- **Gemini** (Google) - Free tier: 60 req/min
- **OpenAI** (ChatGPT) - Requires payment, but very capable
- **Groq** (Fast inference) - Free tier: 30 req/min, extremely fast
- **Hugging Face** - Free tier available
- **Ollama** (Local) - Completely free, runs locally
- **Open-source alternatives** - For budget-conscious deployments

### 3. Free Public Projects to Integrate

#### Option A: Ollama (Best for local/budget)
- **Cost:** Free, open-source
- **Setup:** Download and run locally
- **Models:** Use LLaMA 2, Mistral, etc.
- **Pros:** No API quota limits, works offline
- **Cons:** Requires local server/GPU

#### Option B: Groq API (Best for free cloud)
- **Cost:** Free tier (very generous)
- **Speed:** 10-100x faster than competitors
- **Setup:** Get free API key from groq.com
- **Pros:** Extremely fast, free tier is solid
- **Cons:** Needs internet connection

#### Option C: Together AI (Good alternative)
- **Cost:** Free tier available
- **Models:** Open-source models (LLaMA, Mistral)
- **Setup:** Free API key from together.ai
- **Pros:** Multiple model options
- **Cons:** Free tier limited

#### Option D: Hugging Face Inference (Flexible)
- **Cost:** Free tier available
- **Models:** Thousands of options
- **Setup:** Free token from huggingface.co
- **Pros:** Huge model library
- **Cons:** Slower, more limited free tier

### 4. Recommended Multi-Provider Setup

**For Different Use Cases:**

| Use Case | Provider | Cost | Setup |
|----------|----------|------|-------|
| **Local Development** | Ollama | Free | Run locally |
| **Production (Budget)** | Groq API | Free | Add API key |
| **Production (Scale)** | OpenAI | $$ | Add API key |
| **Hybrid** | Ollama + Groq | Free | Mix local + cloud |

## Database Schema Changes

### New Tables

```sql
-- API Keys (encrypted, per-user)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL, -- 'gemini', 'openai', 'groq', 'ollama'
  key_encrypted TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- for checking duplicates
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  rotated_at TIMESTAMP
);

-- Provider Configuration (admin settings)
CREATE TABLE ai_provider_config (
  id UUID PRIMARY KEY,
  provider TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  default_model TEXT,
  rate_limit_per_minute INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## User Flow

### Step 1: User Adds API Key
```
User visits Settings → API Keys
↓
Choose provider (Gemini/OpenAI/Groq/Ollama)
↓
Enter API key (shown encrypted)
↓
Test connection
↓
Mark as default (optional)
```

### Step 2: Grading Uses User's Key
```
User answers question
↓
Check user's active API keys
↓
Use user's preferred provider
↓
Grade answer with user's quota
↓
Store which provider was used
```

### Step 3: Admin Configuration
```
Admin panel → AI Providers
↓
Enable/disable providers
↓
Set default models
↓
Configure rate limits
↓
Monitor usage per user
```

## Implementation Components

### New UI Components
- `APIKeyManager.tsx` - Add/manage/rotate keys
- `ProviderSelector.tsx` - Choose AI provider
- `ProviderSettings.tsx` - Configure per provider
- `APIKeyStats.tsx` - Usage monitoring

### New API Routes
- `POST /api/keys/add` - Add new API key
- `DELETE /api/keys/[id]` - Delete key
- `PATCH /api/keys/[id]` - Rotate key
- `GET /api/keys/stats` - Usage statistics
- `POST /api/admin/providers` - Configure providers

### New Library Functions
- `getActiveApiKey(userId, provider?)` - Get user's key
- `encryptApiKey(key)` - Encrypt key before storage
- `decryptApiKey(encrypted)` - Decrypt key for use
- `switchProvider(userId, provider)` - Switch to different provider
- `testApiKey(key, provider)` - Validate key works

## Security Considerations

1. **Encryption at Rest**
   - Store keys encrypted using `crypto.encrypt()`
   - Use server's master key for encryption

2. **Encryption in Transit**
   - HTTPS only (Vercel enforces this)
   - Never log API keys

3. **Access Control**
   - Users can only see/edit their own keys
   - Admins can see all (encrypted)
   - Keys never returned in API responses

4. **Key Rotation**
   - Support key rotation without downtime
   - Keep old key active during transition
   - Audit trail of key changes

5. **Audit Logging**
   - Log key additions/deletions (not the key itself)
   - Track which key was used for each grading
   - Monthly usage report per key

## Migration Path

### Phase 1: Support multiple providers (current code)
- Add provider abstraction layer
- Support Gemini + Groq + OpenAI
- Keep working with Vercel env var as fallback

### Phase 2: User API key management
- Add database tables for user keys
- Build UI for key management
- Update grading to use user keys

### Phase 3: Hybrid mode
- Support both env var (admin) and user keys
- Let users choose provider
- Admin controls defaults

### Phase 4: Full user control
- Optional: Remove need for shared env var
- Each user self-service
- Completely decentralized

## Cost Analysis

### Current Setup (Shared Key)
```
Gemini Free: 60 req/min = ~2,880 req/hour
With 50 users: ~58 requests/minute per user
✅ Works until 3 users, then ❌ quota exhausted
```

### New Setup (Per-User Key)
```
Gemini Free: Each user gets own 60 req/min quota
With 50 users: 50 × 60 = 3,000 req/min total
✅ Scales to hundreds of users
```

### Alternative: Groq (Free, Fastest)
```
Groq Free: 30 req/min = ~1,440 req/hour (very fast)
With 50 users: ~29 requests/minute per user
✅ Fast and free for many users
```

## Recommended Implementation

### For MVP (Immediate)
1. Add Groq API support (very fast, free tier is generous)
2. Allow users to add own Gemini/OpenAI/Groq keys
3. Keep Vercel env var as admin fallback
4. Simple key management UI

### For Production
1. Add all 4 providers (Gemini, OpenAI, Groq, Ollama)
2. Full encryption for keys at rest
3. Audit logging and usage tracking
4. Admin provider configuration
5. Key rotation support

## Free Tier Comparison

| Provider | Free Tier | Speed | Quality | Setup |
|----------|-----------|-------|---------|-------|
| **Groq** | 30 req/min | ⭐⭐⭐⭐⭐ Fastest | Good | Easy |
| **Ollama** | Unlimited | ⭐⭐⭐ Medium | Good | Medium |
| **Hugging Face** | Limited | ⭐⭐ Slow | Good | Easy |
| **Together AI** | Limited | ⭐⭐⭐ Medium | Good | Easy |
| **Gemini** | 60 req/min | ⭐⭐⭐ Fast | Great | Easy |

## Next Steps

1. Design API key encryption system
2. Add database tables for user API keys
3. Create provider abstraction layer
4. Build UI for key management
5. Implement Groq support
6. Test multi-provider grading
7. Deploy with hybrid mode (env var + user keys)

This makes the app:
✅ **Scalable** - No shared quota limits
✅ **Flexible** - Support multiple providers
✅ **Free** - Works on free tiers
✅ **Secure** - Encrypted per-user storage
✅ **User-friendly** - Easy key management
