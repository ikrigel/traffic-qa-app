# Getting Started - Traffic Laws Q&A App

This guide walks you through setting up the project from zero to deployment.

## 📋 Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git ([download](https://git-scm.com/))
- GitHub account ([create](https://github.com/signup))
- Supabase account ([create free](https://supabase.com/))
- Google Cloud account ([create](https://cloud.google.com/))

## 🚀 Step 1: Project Setup (5 minutes)

### 1.1 Initialize Git Repository

```bash
cd traffic-qa-app
git init
git add .
git commit -m "initial: scaffold project structure and configuration"
```

### 1.2 Install Dependencies

```bash
npm install
```

Expected output:
```
added 200+ packages, and audited 210 packages in 2m
```

### 1.3 Verify Installation

```bash
npm run type-check
```

Should output: `✓ No TypeScript errors`

## 🔐 Step 2: Supabase Setup (10 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `traffic-qa-app`
   - **Database Password**: Save this securely
   - **Region**: Closest to your users
4. Click "Create new project" (takes ~2 min)
5. Wait for "You're all set!" message

### 2.2 Get Connection Details

1. Go to Project Settings → API
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Service role key

### 2.3 Create Database Tables

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Paste this SQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  theme TEXT DEFAULT 'auto',
  show_answers BOOLEAN DEFAULT false
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  UNIQUE(user_id, device_id)
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
```

4. Click "Run"
5. Should see "Query executed successfully"

### 2.4 Set Up RLS Policies

```sql
-- Users can only read/write their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Sessions policies
CREATE POLICY "Users can read own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);
```

## 🔑 Step 3: Google OAuth Setup (10 minutes)

### 3.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click "Create Project"
3. Name: `Traffic-QA-App`
4. Click "Create"
5. Wait for project to be created

### 3.2 Enable OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in required fields:
   - **App name**: Traffic Laws Q&A
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
5. Click "Save and Continue"
6. Skip scopes (click "Save and Continue")
7. Click "Back to Dashboard"

### 3.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/api/auth/callback`
   - `https://yourdomain.vercel.app/auth/callback` (replace with your Vercel URL)
5. Click "Create"
6. Copy Client ID and Client Secret
7. Add to `.env.local`:
   - `GOOGLE_CLIENT_ID` = Your Client ID
   - `GOOGLE_CLIENT_SECRET` = Your Client Secret

### 3.4 Generate JWT Secret

Create a random JWT secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[System.Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)}))
```

Copy output to `.env.local`:
- `JWT_SECRET` = Your generated secret

## ✅ Step 4: Environment Configuration (5 minutes)

Your `.env.local` should now look like:

```env
# App
NEXT_PUBLIC_APP_NAME=Traffic Laws Q&A
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase (from step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxx...
SUPABASE_SERVICE_ROLE_KEY=eyxxx...

# Google OAuth (from step 3.3)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSX...

# JWT (from step 3.4)
JWT_SECRET=xxxxx...
```

**⚠️ Never commit `.env.local` to Git!** It's already in `.gitignore`

## 🧪 Step 5: Test Locally (5 minutes)

### 5.1 Start Development Server

```bash
npm run dev
```

You should see:
```
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

### 5.2 Open in Browser

Visit http://localhost:3000

You should see the home page loading.

### 5.3 Run Tests

```bash
npm run test
```

Expected: Tests run successfully

## 🌐 Step 6: GitHub Setup (5 minutes)

### 6.1 Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `traffic-qa-app`
   - **Description**: Interactive Q&A app for Israeli traffic laws
   - **Public** or **Private** (your choice)
   - **Initialize**: Leave unchecked
3. Click "Create repository"

### 6.2 Push to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/traffic-qa-app.git

# Rename branch if needed
git branch -M main

# Push code
git push -u origin main
```

### 6.3 Verify on GitHub

Go to your GitHub repository - you should see all files!

## 🚀 Step 7: Vercel Deployment (10 minutes)

### 7.1 Connect Vercel to GitHub

1. Go to https://vercel.com/import
2. Click "Import Git Repository"
3. Select your GitHub account
4. Find and click `traffic-qa-app` repo
5. Click "Import"

### 7.2 Set Environment Variables

1. In Vercel dashboard, go to "Settings" → "Environment Variables"
2. Add all variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` = (your Vercel URL)
3. Click "Save"

### 7.3 Deploy

1. Click "Deploy"
2. Wait ~2-3 minutes for build to complete
3. You should see "Congratulations! Your site is live"
4. Click "Visit" to see your live app!

### 7.4 Update Google OAuth

1. Go back to Google Cloud Console
2. Update Authorized Redirect URIs:
   - Add your Vercel URL: `https://your-app.vercel.app/auth/callback`
3. Save changes

## ✨ Step 8: GitHub Actions (5 minutes)

### 8.1 Verify Workflows

1. Go to your GitHub repo
2. Click "Actions" tab
3. You should see two workflows:
   - "Tests" workflow
   - "Deploy to Vercel" workflow

### 8.2 Add Vercel Secrets

In GitHub repo:
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - Name: `VERCEL_TOKEN`
   - Value: Get from https://vercel.com/account/tokens
4. Add:
   - Name: `VERCEL_ORG_ID`
   - Value: Get from Vercel account settings
5. Add:
   - Name: `VERCEL_PROJECT_ID`
   - Value: Found in Vercel project settings

### 8.3 Test the Workflow

1. Make a small change to README.md
2. Commit and push:
   ```bash
   git add README.md
   git commit -m "test: trigger GitHub Actions"
   git push
   ```
3. Go to GitHub "Actions" tab
4. Should see workflow running
5. Once tests pass, Vercel should auto-deploy

## 📊 Step 9: Verify Everything Works (5 minutes)

### 9.1 Test Locally

```bash
# Development server
npm run dev

# Visit http://localhost:3000
# Test login with Gmail
# Test theme switching
# Test question display
```

### 9.2 Test on Vercel

```bash
# Visit your Vercel URL
# Test same features
# Check browser console for errors
```

### 9.3 Verify GitHub Actions

```bash
# Go to GitHub Actions tab
# Confirm tests pass on every push
# Confirm deployment succeeds
```

## 🎉 Congratulations!

You now have a fully functional, deployed traffic laws Q&A app! 🚗

## 📝 Next Steps

1. **Add Components** - Implement React components from CLAUDE.md
2. **Implement Auth** - Add Google OAuth login flow
3. **Add Tests** - Write unit and integration tests
4. **Customize** - Add your branding and styling
5. **Launch** - Share with friends studying for their license!

## 🆘 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### Supabase Connection Error
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys in `.env.local`
- Check Supabase project is active in dashboard
- Try clearing browser cache and restarting server

### Google OAuth Not Working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URIs match exactly in Google Cloud Console
- Ensure your app URL is in authorized URIs

### Vercel Deployment Fails
- Check "Deployments" tab in Vercel dashboard
- Look at build logs for specific errors
- Verify environment variables are set
- Try redeploying manually

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💬 Need Help?

- Check CLAUDE.md for architecture details
- Read README.md for feature documentation
- See CONTRIBUTING.md for development guidelines
- Open an issue on GitHub

---

**You're all set!** Start building amazing features for your traffic laws app! 🎓
