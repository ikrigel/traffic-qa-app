# Traffic Laws Q&A App - Development Guide

## Project Overview
A responsive React-based Q&A application for studying Israeli traffic laws (דיני תעבורה). Features Gmail authentication, persistent sessions, theme switching, and a curated question database.

## Key Features
- **Question Database**: 23 traffic law questions extracted from Hebrew driving instructor materials
- **Priority Questions**: Questions 3, 6, 7, 10, 11, 20 highlighted (highest exam frequency)
- **Authentication**: Gmail OAuth with persistent session management
- **Theme Support**: Dark, Light, and Auto (system) modes
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Modals**: Settings (theme, show/hide answers) and About pages
- **Max File Size**: 250 lines per component for maintainability

## Tech Stack
- **Frontend**: React 18 + TypeScript + Next.js 14
- **Styling**: Tailwind CSS
- **Auth**: Google OAuth (Gmail)
- **Database**: Supabase (PostgreSQL) for user data & sessions
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
│   │   ├── auth/
│   │   │   └── callback/route.ts (150 lines max)
│   │   └── api/
│   │       ├── auth/route.ts (150 lines max)
│   │       └── questions/route.ts (150 lines max)
│   ├── components/
│   │   ├── QuestionCard.tsx (200 lines max)
│   │   ├── QuestionList.tsx (200 lines max)
│   │   ├── SettingsModal.tsx (200 lines max)
│   │   ├── AboutModal.tsx (150 lines max)
│   │   ├── Header.tsx (150 lines max)
│   │   └── ThemeToggle.tsx (100 lines max)
│   ├── hooks/
│   │   ├── useAuth.ts (100 lines max)
│   │   ├── useTheme.ts (80 lines max)
│   │   └── useQuestions.ts (100 lines max)
│   ├── lib/
│   │   ├── supabase.ts (80 lines max)
│   │   ├── auth.ts (120 lines max)
│   │   ├── questions.ts (100 lines max)
│   │   └── constants.ts (50 lines max)
│   ├── types/
│   │   └── index.ts (100 lines max)
│   └── styles/
│       └── globals.css
├── public/
├── tests/
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
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  theme TEXT DEFAULT 'auto',
  show_answers BOOLEAN DEFAULT false
);

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

## Authentication Flow
1. User clicks "Login with Gmail"
2. Redirected to Google OAuth consent screen
3. OAuth callback at `/auth/callback` exchanges code for token
4. User stored/retrieved in Supabase users table
5. Session token created and stored in httpOnly cookie
6. User email displayed on dashboard
7. Logout clears session cookie

## Authentication Setup
1. Google Cloud Console:
   - OAuth 2.0 Client ID (Web application)
   - Authorized JavaScript origins: `https://traffic-qa-app.vercel.app`, `http://localhost:3000`
   - Authorized redirect URIs: `https://traffic-qa-app.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
   - OAuth consent screen: **Published to production**

2. Supabase:
   - Database: PostgreSQL with users and sessions tables
   - RLS policies: Each user can only access their own data
   - Schema deployed via SQL migrations in `supabase/migrations/`

3. Environment Variables (Vercel & GitHub Actions):
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
   - `GOOGLE_CLIENT_ID` - Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `JWT_SECRET` - Session token signing key
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
# NEXT_PUBLIC_APP_URL=http://localhost:3000

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
3. Click "Login with Gmail"
4. Verify OAuth redirects and user appears in Supabase
5. Check httpOnly auth cookie in browser DevTools

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

## Deployment to Vercel
1. GitHub repo connected to Vercel project
2. Environment variables set in Vercel dashboard (Production environment)
3. GitHub Actions test workflow runs on every push
4. Once tests pass, Vercel auto-deploys
5. Dynamic routes configured to prevent static generation errors

**Vercel Environment Variables (Production):**
- All 6 variables from GitHub Actions secrets
- `NEXT_PUBLIC_APP_URL` = `https://traffic-qa-app.vercel.app`

**Deployment Status:** Live at https://traffic-qa-app.vercel.app

## File Size Constraints
Every component/module must stay under 250 lines:
- Break large features into smaller, focused files
- Use custom hooks to separate logic
- Lazy load heavy components
- Keep utilities in separate files

## Testing Strategy
- Unit tests for utilities and hooks
- Component tests for UI interactions
- Integration tests for auth flow
- E2E tests for critical user journeys

## Performance Considerations
- Code splitting with Next.js dynamic imports
- Image optimization (Vercel Image)
- CSS-in-JS optimization with Tailwind
- Session tokens stored securely (httpOnly cookies)
- Device fingerprinting for session management

## Security
- Never store auth tokens in localStorage (use httpOnly cookies)
- CSRF protection with SameSite cookies
- Rate limiting on auth endpoints
- Secure device fingerprinting
- Input validation on all user data

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

## Maintenance Notes
- Update dependencies monthly
- Monitor Vercel analytics
- Review auth session expiry
- Backup database regularly
- Monitor error logs via Vercel dashboard

## Current Implementation Status

### ✅ Implemented
- Next.js 14 app with TypeScript
- Gmail OAuth authentication flow
- Session management with httpOnly cookies
- Supabase database integration
- User authentication and persistence
- Home page with login/logout buttons
- GitHub Actions CI/CD pipeline
- Vercel deployment automation
- ESLint and TypeScript type checking
- Dynamic route handling for OAuth callback

### 🔄 In Progress / To Implement
- Question database display and fetching
- Q&A card components with question/answer toggle
- Theme switching (dark/light/auto modes)
- Settings modal (theme, show answers toggle)
- About modal with app information
- Question filtering and search
- Progress tracking and bookmarks
- Test suite for components and utilities

### 📋 Planned Enhancements
- Spaced repetition algorithm for learning optimization
- Progress tracking and analytics
- Practice tests with scoring system
- Bookmark/favorites functionality
- Offline mode with Progressive Web App (PWA)
- Multi-language support (Hebrew/English)
- Admin dashboard for question management
- Mobile app version (React Native)

## Troubleshooting

### OAuth Login Issues
1. Verify Google OAuth consent screen is published to production
2. Check Authorized JavaScript origins and redirect URIs in Google Cloud Console
3. Ensure environment variables are set correctly in Vercel
4. Wait 5-10 minutes for Google to apply configuration changes

### Build Failures
1. Ensure all required environment variables are set in GitHub Actions secrets
2. Check `npm run type-check` passes locally
3. Verify `npm run lint` passes locally
4. Make sure Next.js dynamic routes are configured with `export const dynamic = 'force-dynamic'`

### Database Connection Issues
1. Verify Supabase credentials in `.env.local`
2. Check that database schema is deployed (users and sessions tables exist)
3. Verify RLS policies allow your user to access data
4. Check Supabase dashboard for any connection errors
