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
2. OAuth callback stores/retrieves user in Supabase
3. Device ID generated (localStorage + fingerprint)
4. Session token stored with device association
5. Persistent login maintained across sessions
6. New device requires re-login

## Development Workflow

### Setup
```bash
git clone <repo>
npm install
cp .env.example .env.local
npm run dev
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript check

## GitHub Actions Workflows

### Test Workflow (.github/workflows/test.yml)
- Runs on every push to main
- Runs unit and integration tests
- Checks TypeScript compilation
- Runs linter

### Deploy Workflow (.github/workflows/deploy.yml)
- Triggers after tests pass
- Deploys to Vercel on push to main
- Auto-deploys on PR merge

## Deployment to Vercel
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. GitHub Actions will auto-deploy on main push
4. Preview deployments for PRs

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

## Future Enhancements
- Spaced repetition algorithm
- Progress tracking
- Practice tests with scoring
- Bookmarks/favorites
- Offline mode with PWA
- Multi-language support
- Admin dashboard for question management
