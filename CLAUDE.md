# Traffic Laws Q&A App - Development Guide

## Project Overview
A responsive React-based Q&A application for studying Israeli traffic laws (דיני תעבורה). Features Gmail authentication, persistent JWT-signed sessions, role-based access control, RAG-grounded AI chat assistant, AI-graded answer evaluation, and an admin panel for managing users, content, and debugging.

## Key Features
- **Question Database**: 23 traffic law questions extracted from Hebrew driving instructor materials
- **Priority Questions**: Questions 3, 6, 7, 10, 11, 20 highlighted (highest exam frequency)
- **Authentication**: Gmail OAuth with persistent session management and JWT-hardened tokens
- **Role-Based Access Control**: User (default), Admin (moderation + debugging), Super Admin (full control)
- **Admin Panel**: User management, RAG document ingestion, debug log viewing, RAGAS evaluation testing
- **RAG-Grounded AI Chat Assistant**: Gemini embeddings with Pinecone vector DB for fast, scalable document retrieval
- **AI-Graded Testing**: Users answer questions via typed or voice input; instant feedback via RAGAS evaluation metrics
- **Theme Support**: Dark, Light, and Auto (system) modes
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Modals**: Help (Hebrew guide), About (developer profile), and Settings pages
- **Automatic Location Capture**: Vercel IP geolocation headers with Google locale fallback
- **Max File Size**: 250 lines per file for maintainability (enforced across all components, hooks, utilities, and lib files)

## Tech Stack
- **Frontend**: React 18 + TypeScript + Next.js 14
- **Styling**: Tailwind CSS
- **Auth**: Google OAuth (Gmail) + JWT session tokens (jsonwebtoken)
- **Database**: Supabase (PostgreSQL) for users, sessions, documents
- **Vector DB**: Pinecone for RAG embeddings and similarity search (768D vectors)
- **AI**: Google Gemini API (gemini-embedding-001 for vectors, generation via multi-provider)
- **Evaluation**: RAGAS engine (@ikrigel/ragas-lib-typescript) for answer grading
- **Deployment**: Vercel with GitHub Actions
- **Testing**: Vitest + React Testing Library
- **Version Control**: GitHub

## Project Structure
```
traffic-qa-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx (250 lines max)
│   │   ├── page.tsx (250 lines max)
│   │   ├── admin/
│   │   │   └── page.tsx (200 lines max)
│   │   ├── auth/
│   │   │   └── callback/route.ts (150 lines max)
│   │   └── api/
│   │       ├── auth/route.ts (150 lines max)
│   │       ├── user/route.ts (80 lines max)
│   │       ├── admin/
│   │       │   ├── users/route.ts (150 lines max)
│   │       │   ├── users/[id]/route.ts (150 lines max)
│   │       │   ├── rag-documents/route.ts (150 lines max)
│   │       │   ├── logs/route.ts (100 lines max)
│   │       │   ├── evaluations/route.ts (150 lines max)
│   │       │   └── test-attempts/route.ts (100 lines max)
│   │       ├── chat/route.ts (100 lines max)
│   │       └── test/evaluate/route.ts (100 lines max)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminPanelContainer.tsx (180 lines max)
│   │   │   ├── UserManagementPanel.tsx (200 lines max)
│   │   │   ├── RagDocumentsPanel.tsx (150 lines max)
│   │   │   ├── DebugLogsPanel.tsx (120 lines max)
│   │   │   ├── RagEvaluationPanel.tsx (200 lines max)
│   │   │   ├── DevkitConsolePanel.tsx (50 lines max)
│   │   │   └── RagasScoreBadges.tsx (80 lines max)
│   │   ├── QuestionCard.tsx (220 lines max)
│   │   ├── QuestionList.tsx (200 lines max)
│   │   ├── TestAnswerInput.tsx (150 lines max)
│   │   ├── ChatAssistant.tsx (120 lines max)
│   │   ├── HelpModal.tsx (150 lines max)
│   │   ├── AboutModal.tsx (200 lines max)
│   │   ├── SettingsModal.tsx (200 lines max)
│   │   ├── Header.tsx (150 lines max)
│   │   └── ThemeToggle.tsx (100 lines max)
│   ├── hooks/
│   │   ├── useAuth.ts (120 lines max)
│   │   ├── useTheme.ts (80 lines max)
│   │   ├── useQuestions.ts (100 lines max)
│   │   ├── useChatAssistant.ts (60 lines max)
│   │   ├── useAdminUsers.ts (80 lines max)
│   │   ├── useAdminRagDocuments.ts (80 lines max)
│   │   ├── useAdminLogs.ts (80 lines max)
│   │   ├── useAdminEvaluations.ts (80 lines max)
│   │   └── useAdminTestAttempts.ts (80 lines max)
│   ├── lib/
│   │   ├── supabase.ts (80 lines max)
│   │   ├── auth.ts (120 lines max)
│   │   ├── session.ts (100 lines max)
│   │   ├── requireRole.ts (40 lines max)
│   │   ├── logger.ts (50 lines max)
│   │   ├── geo.ts (50 lines max)
│   │   ├── gemini.ts (60 lines max)
│   │   ├── pinecone.ts (50 lines max)
│   │   ├── rag.ts (50 lines max)
│   │   ├── ragasClient.ts (60 lines max)
│   │   ├── grading.ts (70 lines max)
│   │   ├── adminApi.ts (60 lines max)
│   │   ├── questions.ts (100 lines max)
│   │   ├── traffic-law-questions.ts (250 lines max for questions data)
│   │   ├── constants.ts (60 lines max)
│   │   └── devkitConsole.ts (30 lines max)
│   ├── types/
│   │   └── index.ts (150 lines max)
│   └── styles/
│       └── globals.css
├── supabase/
│   └── migrations/
│       ├── 20260802000000_add_rbac_admin_panel.sql
│       ├── 20260802000001_add_rag_vector_and_evaluations.sql
│       └── 20260802000002_add_test_attempts.sql
├── public/
├── tests/
│   ├── lib/
│   │   ├── session.test.ts
│   │   ├── ragasClient.test.ts
│   │   └── grading.test.ts
│   ├── __tests__/
│   │   ├── components.test.tsx
│   │   ├── auth.test.ts
│   │   └── utils.test.ts
│   └── setup.ts
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── README.md
```

## Important Questions (Priority)
- **Q3**: Maximum speed limits by road type and vehicle type
- **Q6**: Overtaking (עקיפה) rules and restrictions
- **Q7**: Seatbelt and child safety seat requirements
- **Q10**: Left turn procedures
- **Q11**: New driver regulations and requirements
- **Q20**: U-turn (פניית פרסה) procedures

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  location TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  theme TEXT DEFAULT 'auto',
  show_answers BOOLEAN DEFAULT false
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  UNIQUE(user_id, device_id)
);
```

### RAG Documents Table
```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Debug Logs Table
```sql
CREATE TABLE debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT CHECK (level IN ('info', 'warn', 'error')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### RAG Evaluations Table
```sql
CREATE TABLE rag_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  expected_answer TEXT,
  ai_answer TEXT NOT NULL,
  retrieved_document_ids UUID[],
  metrics JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Test Attempts Table
```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  input_method TEXT CHECK (input_method IN ('typed', 'voice')),
  verdict TEXT CHECK (verdict IN ('correct', 'partial', 'incorrect')),
  metrics JSONB,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Authentication Flow

### Session Hardening
1. User clicks "Login with Gmail"
2. Redirected to Google OAuth consent screen
3. OAuth callback at `/auth/callback` exchanges code for token
4. User stored/updated in Supabase `users` table with location data
5. Session token signed as JWT using `jsonwebtoken` + `JWT_SECRET` (payload: `{ userId, email }` only, no role)
6. Session token stored in httpOnly cookie
7. Role fetched fresh from `users` table on every request (self-healing: treats `ikrigel@gmail.com` as `super_admin`)
8. User email and role displayed on dashboard
9. Logout clears session cookie

### Location Capture
- **Primary**: Vercel automatic IP geolocation headers (`x-vercel-ip-country`, `x-vercel-ip-city`)
- **Fallback**: Parse region from Google's locale claim in ID token (e.g., `he-IL` → country `IL`)
- **Stored**: `location`, `country`, `city` fields in `users` table

## Role-Based Access Control

### Roles
- **User** (default): Can view questions, answer questions via typed/voice input, access chat assistant, view own test history
- **Admin**: All user permissions + view debug logs, remove users, evaluate RAG with manual pipeline testing, view all test attempts
- **Super Admin**: All admin permissions + change user roles, create/manage RAG documents, access live DevKit Console debugging panel, self-healing enforcement (email `ikrigel@gmail.com`)

### Protected Routes
- `/admin/*` — Accessible to `admin` and `super_admin` only
- `/api/admin/*` — All protected by `requireRole` middleware with role enforcement

## Authentication Setup
1. Google Cloud Console:
   - OAuth 2.0 Client ID (Web application)
   - Authorized JavaScript origins: `https://traffic-qa-app.vercel.app`, `http://localhost:3000`
   - Authorized redirect URIs: `https://traffic-qa-app.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
   - OAuth consent screen: **Published to production**

2. Supabase:
   - Database: PostgreSQL with all schema tables (users, sessions, rag_documents, debug_logs, rag_evaluations, test_attempts)
   - pgvector extension: Enabled for vector similarity search
   - RLS policies: RESTRICTIVE deny-all for defense-in-depth (all access via service-role client)
   - Schema deployed via SQL migrations in `supabase/migrations/`

3. Environment Variables (Vercel & GitHub Actions):
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
   - `GOOGLE_CLIENT_ID` - Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `JWT_SECRET` - Session token signing key (must be a strong random string)
   - `GEMINI_API_KEY` - Google Gemini API key for embeddings and text generation
   - `NEXT_PUBLIC_APP_URL` - App URL (http://localhost:3000 or Vercel URL)

## Development Workflow

### Local Setup
```bash
# Clone and install
git clone https://github.com/ikrigel/traffic-qa-app.git
cd traffic-qa-app
npm install --legacy-peer-deps

# Create .env.local from .env.example
cp .env.example .env.local

# Fill in environment variables from Supabase and Google Cloud Console
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# JWT_SECRET=
# GEMINI_API_KEY=
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# Apply database migrations in Supabase
# Run migrations via Supabase Dashboard or CLI

# Start dev server
npm run dev
# Visit http://localhost:3000
```

### Available Commands
- `npm run dev` - Start Next.js dev server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run test` - Run Vitest test suite
- `npm run format` - Format code with Prettier

### Testing Locally
1. Start dev server: `npm run dev`
2. Visit http://localhost:3000
3. Click "Login with Gmail" using `ikrigel@gmail.com` for super admin access
4. Verify OAuth redirects and user appears in Supabase with role=super_admin
5. Check JWT auth token cookie in browser DevTools
6. Test admin panel features: user management, RAG documents, debug logs
7. Test user features: chat assistant, typed/voice answer evaluation
8. Verify test attempts appear in admin panel with RAGAS metrics

## API Endpoints

### Admin Routes (Protected)
- **GET /api/admin/users** - List all users with location/country/city (admin+)
- **PATCH /api/admin/users/[id]** - Change user role (super_admin only)
- **DELETE /api/admin/users/[id]** - Remove user (admin+)
- **GET /api/admin/rag-documents** - List RAG documents (super_admin only)
- **POST /api/admin/rag-documents** - Create RAG document with auto-embedding (super_admin only)
- **GET /api/admin/logs** - View debug logs with optional level filter (admin+)
- **GET /api/admin/evaluations** - List past RAGAS evaluations (admin+)
- **POST /api/admin/evaluations** - Run manual RAG evaluation test (admin+)
- **GET /api/admin/test-attempts** - View all user test attempts with verdicts (admin+)

### User Routes
- **GET /api/user** - Get current user info (id, email, role)
- **POST /api/chat** - Chat with RAG-grounded AI assistant
- **POST /api/test/evaluate** - Grade a user answer via RAGAS evaluation

## RAG + RAGAS Evaluation

### Document Ingestion (Super Admin)
1. Upload or paste raw text content in admin panel
2. System automatically embeds via Google Gemini `text-embedding-004` (768 dimensions)
3. Document stored in `rag_documents` with embedding vector
4. HNSW index enables fast cosine-distance similarity search

### Answer Evaluation
- **User Test**: When user types/speaks an answer, system retrieves 5 similar RAG documents, scores answer via RAGAS engine (Faithfulness, Relevance, Coherence, Context Precision, Context Recall), derives verdict (correct/partial/incorrect)
- **Admin Evaluation**: Super admin can run manual tests on new question+expected-answer pairs to validate RAG quality before deployment
- **Metrics**: All RAGAS metrics (0-1 scale) stored in `test_attempts.metrics` and `rag_evaluations.metrics` JSONB columns

## Debugging

### Admin View (Read-Only Logs)
- `DebugLogsPanel` shows persisted `debug_logs` table entries
- Filterable by level (info/warn/error)
- Shows source, message, and context
- Available to `admin` and `super_admin`

### Super Admin View (Live Console)
- `DevkitConsolePanel` renders live client-side debugging via devkit-console-ui
- Shows application logs, state changes, and performance metrics
- Access to full log history and export functionality
- Only visible and available to `super_admin` users

## GitHub Actions Workflows

### Test Workflow (.github/workflows/test.yml)
- Runs on every push to main and PRs
- Installs dependencies with `npm install --legacy-peer-deps`
- Runs ESLint (`npm run lint`)
- Type-checks TypeScript (`npm run type-check`)
- Builds project (`npm run build`)
- All tests must pass before Vercel deployment

**Required GitHub Actions Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `GEMINI_API_KEY`

## Deployment to Vercel
1. GitHub repo connected to Vercel project
2. Environment variables set in Vercel dashboard (Production environment)
3. GitHub Actions test workflow runs on every push
4. Once tests pass, Vercel auto-deploys
5. Dynamic routes configured to prevent static generation errors

**Vercel Environment Variables (Production):**
- All 7 variables from GitHub Actions secrets
- `NEXT_PUBLIC_APP_URL` = `https://traffic-qa-app.vercel.app`

**Deployment Status:** Live at https://traffic-qa-app.vercel.app

## File Size Constraints
**ENFORCED: Every TypeScript/TSX file must stay under 250 lines** (measured from first line of code)

This includes:
- All React components (`.tsx`)
- All utilities and helpers (`.ts`)
- All hooks (`.ts`)
- All lib files (`.ts`)
- API routes (`.ts`)

When a file approaches 250 lines:
- Split into multiple focused files
- Extract logic into separate utility/hook files
- Move data/constants to dedicated files
- Use barrel exports (`index.ts`) to maintain clean imports

## Testing Strategy
- **Unit tests**: JWT signing/verification, RAGAS evaluation metrics, answer grading logic
- **Component tests**: UI interactions, modal states, admin panel forms
- **Integration tests**: Auth flow, database operations, API endpoints
- **E2E tests**: Full user journey: login → answer question → view results → admin review

### Test Files
- `tests/lib/session.test.ts` - JWT session token signing and verification
- `tests/lib/ragasClient.test.ts` - RAGAS evaluation metric calculation
- `tests/lib/grading.test.ts` - User answer grading with RAGAS integration
- `tests/__tests__/components.test.tsx` - Component rendering and interactions
- `tests/__tests__/auth.test.ts` - OAuth and session auth tests
- `tests/__tests__/utils.test.ts` - Utility function tests

## Performance Considerations
- Code splitting with Next.js dynamic imports
- Image optimization (Vercel Image)
- CSS-in-JS optimization with Tailwind
- Session tokens stored securely (httpOnly, JWT-signed)
- Vector similarity search optimized via HNSW index on pgvector
- Lazy-loaded service-role Supabase clients (singleton pattern)
- Gemini API calls cached where feasible (embeddings rarely change)

## Security
- **Session Tokens**: Signed JWT (jsonwebtoken + JWT_SECRET) instead of unsigned base64
- **Role Enforcement**: Every protected route validates role fresh from database (self-healing)
- **Super Admin Protection**: Hardcoded email (`ikrigel@gmail.com`) cannot be demoted or deleted, enforced at three layers (migration, callback, session lookup)
- **RLS Policies**: RESTRICTIVE deny-all on all tables (defense-in-depth; main enforcement via service-role server-side clients)
- **Never localStorage**: Auth tokens stored in httpOnly cookies only
- **CSRF Protection**: SameSite=Strict cookies
- **Rate Limiting**: Recommended on auth endpoints (not yet implemented)
- **Input Validation**: All user data validated at API boundaries before database operations

## Responsive Breakpoints (Tailwind)
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Color contrast ratios (WCAG AA)
- Semantic HTML
- Focus management in modals
- Hebrew RTL text layout support

## Maintenance Notes
- Update dependencies monthly
- Monitor Vercel analytics and build logs
- Review auth session expiry (currently 90 days)
- Backup Supabase database regularly
- Monitor error logs via `debug_logs` table and Vercel dashboard
- Review RAGAS metrics quality periodically (re-train if accuracy drifts)
- Rotate `JWT_SECRET` and `GEMINI_API_KEY` annually

## Version Management

**Current Version**: 1.15.0 (see `package.json` and `src/lib/constants.ts`)

### Semantic Versioning Rules
Follow [Semantic Versioning](https://semver.org/) for all releases:

- **MAJOR** (X.0.0): Breaking changes, major refactors, or architectural changes
  - Example: Complete auth system rewrite, database schema redesign
  - Update: `package.json` → `x.0.0`, `constants.ts` → `APP_VERSION = 'x.0.0'`

- **MINOR** (x.Y.0): New features, significant enhancements, or new capabilities
  - Example: New admin panel feature, new evaluation system, new modals
  - Update: `package.json` → `x.y.0`, `constants.ts` → `APP_VERSION = 'x.y.0'`

- **PATCH** (x.y.Z): Bug fixes, security patches, or minor improvements
  - Example: Fix auth cookie transmission, improve error logging, UI fixes
  - Update: `package.json` → `x.y.z`, `constants.ts` → `APP_VERSION = 'x.y.z'`

### Version Update Workflow
1. Determine change type (Major/Minor/Patch)
2. Update `package.json` version field
3. Update `APP_VERSION` in `src/lib/constants.ts`
4. About modal displays version automatically via `APP_VERSION`
5. Include version bump in commit message
6. Example commit: `chore: Bump version to 1.2.0`

### Quick Reference
```bash
# Current version
cat package.json | grep version
cat src/lib/constants.ts | grep APP_VERSION

# When committing
git commit -m "fix: Fix auth cookie transmission (#123)

- Improved cookie setting with explicit credentials
- Fixed useAuth re-check on navigation
- Added detailed error logging

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# Version is auto-displayed in About modal (アプリ v1.2.3)
```

## Current Implementation Status

### ✅ Fully Implemented (v1.15.0)

**Authentication & Security:**
- ✅ Gmail OAuth authentication with Google consent flow
- ✅ JWT-signed session tokens (secure httpOnly cookies)
- ✅ Role-based access control (user, admin, super_admin)
- ✅ Self-healing super_admin enforcement (ikrigel@gmail.com)
- ✅ Location capture from Vercel geolocation + Google locale fallback
- ✅ Session persistence across page reloads with credential-aware fetch

**Admin Panel (Full Implementation):**
- ✅ Role-based access control (403 for unauthorized users)
- ✅ User Management: list, change roles, delete users (protect hardcoded super_admin)
- ✅ RAG Documents: upload with title/source, list with embedding status
- ✅ Debug Logs: real-time log viewer with level filtering (info/warn/error) + localStorage persistence
- ✅ RAG Evaluation: manual pipeline testing + user test attempts feed with verdicts
- ✅ DevKit Console: placeholder for live client-side debugging (super_admin only)
- ✅ Course Management: Create/manage courses, link questions to courses (v1.14.0)
- ✅ Multiple Choice Questions: Admin-created questions with multiple choice/free text support (v1.14.0)
- ✅ **Admin Instructions Modal (v1.15.0)**: Comprehensive guide for each admin panel feature
- ✅ All admin hooks: useAdminUsers, useAdminRagDocuments, useAdminLogs, useAdminEvaluations, useAdminTestAttempts
- ✅ Loading states, error handling, empty states, data refresh buttons

**User Features (Full Implementation):**
- ✅ Chat Assistant: RAG-grounded Q&A with source citation (bottom-right float)
- ✅ Test Answer Input: typed or voice input with AI grading (בחן אותי button)
- ✅ Web Speech API: voice recognition in Hebrew (he-IL locale)
- ✅ Answer Grading: RAGAS evaluation with 5 detailed metrics and progress bars (v1.14.0)
- ✅ Test History: admin can see all user test attempts with verdicts and detailed scores
- ✅ **Tutor Modal (v1.15.0)**: 4 teaching modes (📚 Tutor/🎯 Quiz/✍️ Exam/📋 Summary) in rich modal
- ✅ **Tutor Mode Info**: Clear descriptions and tips for each mode's purpose

**Infrastructure (v1.14.0):**
- ✅ Supabase database (PostgreSQL) for users, sessions, documents, courses, questions
- ✅ **Pinecone vector database** for RAG embeddings (1024D multilingual-e5-large vectors, fast similarity search)
- ✅ Google Gemini API: gemini-embedding-001 (768D vectors), multi-provider generation fallback
- ✅ RAGAS evaluation engine with 5 metrics (Faithfulness, Relevance, Coherence, Context Precision/Recall)
- ✅ Server-side debug logging with context capture
- ✅ JWT session verification with fresh role lookup on every request
- ✅ Voice-to-text with Web Speech API (Hebrew support, explicit microphone permission)
- ✅ Admin panel tab memory + debug logging state persistence via localStorage

**Testing (v1.14.0):**
- ✅ Admin operations tests (user mgmt, RAG docs, logging, test tracking, courses)
- ✅ Chat assistant tests (message structure, validation, XSS protection)
- ✅ Answer grading tests (verdicts, detailed metrics, voice input, Hebrew support)
- ✅ Pinecone connection tests (query, upsert, delete operations)
- ✅ RAG pipeline tests (embedding, retrieval, generation)

**Documentation:**
- ✅ CLAUDE.md with complete architecture and troubleshooting
- ✅ Semantic versioning (MAJOR.MINOR.PATCH)
- ✅ 250-line max file size enforced across all components
- ✅ Help and About modals with updated feature descriptions

### 🔄 Future Enhancements
- Rate limiting on auth endpoints
- Spaced repetition algorithm
- Progress tracking dashboard
- Leaderboard and badges
- Bookmark/favorites
- Offline PWA mode
- Mobile app (React Native)
- Real-time collaboration
- Analytics and reporting

### 📋 Planned Enhancements
- Real-time collaboration for admin review
- Leaderboard and achievement badges
- Integration with external learning platforms
- AI-powered question generation from documents
- Advanced analytics and reporting
- Custom question creation by admins

## Troubleshooting

### OAuth Login Issues
1. Verify Google OAuth consent screen is published to production
2. Check Authorized JavaScript origins and redirect URIs in Google Cloud Console
3. Ensure environment variables are set correctly in Vercel
4. Wait 5-10 minutes for Google to apply configuration changes
5. For local dev without Vercel headers, ensure `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Build Failures
1. Ensure all required environment variables are set in GitHub Actions secrets
2. Check `npm run type-check` passes locally
3. Verify `npm run lint` passes locally
4. Make sure Next.js dynamic routes are configured with `export const dynamic = 'force-dynamic'`
5. Verify all three database migrations are applied to Supabase

### Database Connection Issues
1. Verify Supabase credentials in `.env.local`
2. Check that all required tables exist: users, sessions, rag_documents, debug_logs, rag_evaluations, test_attempts
3. Verify pgvector extension is enabled
4. Verify RLS policies allow service-role client access
5. Check Supabase dashboard for any connection errors

### Gemini API Issues
1. Verify `GEMINI_API_KEY` is set and valid in `.env.local` and Vercel
2. Check Google Cloud Console for API quota and billing status
3. Ensure `text-embedding-004` and `gemini-1.5-flash` models are enabled
4. Monitor rate limits (free tier: ~60 requests per minute)
5. Errors are logged to `debug_logs` table for admin review

### JWT Session Issues
1. Verify `JWT_SECRET` is set to a strong random string (min 32 characters)
2. Check httpOnly cookie is present in browser DevTools
3. Verify cookie domain/path are correct for your deployment URL
4. Ensure token expiry in `session.ts` matches your requirements
5. Role changes take effect immediately without re-login due to fresh database lookup

### RAGAS Evaluation Issues
1. Verify at least one RAG document is ingested with populated embeddings
2. Check that user's answer and correct answer are provided to grading endpoint
3. Verify Gemini API is working (check debug_logs for errors)
4. Metrics should all be between 0-1; if not, check ragasClient.ts implementation
5. Admin can manually test RAG quality via Evaluation panel before deploying

### Admin Panel Access
1. Verify user role is set to 'admin' or 'super_admin' in database
2. Access denied page shows if role is 'user' — refresh after role change
3. Only super_admin can change roles or access RAG documents
4. Debug logs require 'admin' role or higher
5. Test attempts feed shows all user attempts for review

### API Keys Management Issues (v1.3.0+)
**Error**: "fail to add api key" in Settings modal

**Root Causes**:
1. **Database migration not applied** (most common): The `api_keys` table doesn't exist on Vercel
2. **ENCRYPTION_KEY not set**: Falls back to JWT_SECRET (should work), but check if both are missing
3. **User authentication failed**: Verify session is active (`/api/user` returns user info)
4. **Provider validation**: Check provider value is one of: `gemini`, `openai`, `groq`, `ollama`, `huggingface`

**Fix Instructions**:

1. **Apply Database Migration to Vercel**:
   ```bash
   # Option A: Using Supabase Dashboard
   - Go to Supabase dashboard for your project
   - Navigate to SQL Editor
   - Create new query and copy contents of:
     supabase/migrations/20260805000000_add_api_keys_management.sql
   - Run the migration
   - Verify tables created: api_keys, ai_provider_config, api_key_usage

   # Option B: Using Supabase CLI
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --dry-run  # Preview changes
   npx supabase db push            # Apply migrations
   ```

2. **Verify Environment Variables**:
   - Check Vercel dashboard → Settings → Environment Variables
   - Ensure `ENCRYPTION_KEY` or `JWT_SECRET` is set (at least one must exist)
   - For production, set `ENCRYPTION_KEY` to a different value than `JWT_SECRET` for better security
   - Example: `ENCRYPTION_KEY=your-32-character-random-string-here`

3. **Check Database Schema**:
   ```sql
   -- Run in Supabase SQL Editor to verify
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'api%';
   
   -- Should return: api_keys, ai_provider_config, api_key_usage
   ```

4. **Test API Endpoint Manually**:
   ```bash
   # Get API keys (should return 200 and {"keys": []})
   curl -X GET https://traffic-qa-app.vercel.app/api/user/keys \
     -H "Cookie: your-auth-cookie-here"
   
   # Should show empty array if no keys exist yet
   ```

5. **Check Browser Console for Detailed Errors**:
   - Open Developer Tools → Console
   - Look for error messages with "Failed to add API key" and full error text
   - Common errors:
     - `relation "public.api_keys" does not exist` → Migration not applied
     - `Failed to encrypt API key` → ENCRYPTION_KEY issues
     - `Not authenticated` → Session expired, refresh and login again

6. **Verify in Admin Panel** (if you're super_admin):
   - Go to Admin Panel → Debug Logs
   - Filter by level "error"
   - Look for entries from `apiKeysService.addApiKey`
   - Logs show the exact database error

**Prevention**:
- Always apply new database migrations after pulling new code
- Document new environment variables in `.env.example` and Vercel settings
- Test API key features on staging before production deployment
