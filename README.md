# 🚗 Traffic Laws Q&A App

An interactive, responsive web application for learning Israeli traffic laws (דיני תעבורה) with Gmail authentication, persistent sessions, and theme support.

## 🌟 Features

- **📚 23 Interactive Questions**: Comprehensive traffic law questions with detailed answers in Hebrew and English
- **🎯 Priority Questions**: 6 high-frequency exam questions highlighted (Q3, Q6, Q7, Q10, Q11, Q20)
- **👤 Gmail Authentication**: Secure OAuth login with Google accounts
- **💾 Persistent Sessions**: Auto-login across browser sessions (90-day expiry)
- **🎨 Theme Support**: Light, Dark, and Auto (system) modes
- **📱 Fully Responsive**: Mobile-first design for all screen sizes
- **⚙️ Settings Modal**: Customize theme and answer visibility
- **ℹ️ About Modal**: App information and credits
- **🔒 Secure**: HTTPS-only, httpOnly cookies, CSRF protection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Google OAuth credentials
- Supabase account (for database)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/traffic-qa-app.git
cd traffic-qa-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Fill in your credentials
# Edit .env.local with:
# - Supabase URL and keys
# - Google OAuth client ID and secret
# - JWT secret
```

### Configuration

1. **Supabase Setup**:
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
   ```

2. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials (Web application)
   - Add `http://localhost:3000/auth/callback` and your production URL as authorized redirects
   - Copy Client ID and Secret to `.env.local`

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run type check
npm run type-check

# Format code
npm run format
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── auth/callback/       # OAuth callback
│   └── api/                 # API routes
├── components/              # React components
│   ├── QuestionCard.tsx     # Single question display
│   ├── QuestionList.tsx     # Questions list
│   ├── SettingsModal.tsx    # Settings panel
│   ├── AboutModal.tsx       # About information
│   ├── Header.tsx           # App header
│   └── ThemeToggle.tsx      # Theme switcher
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts           # Authentication logic
│   ├── useTheme.ts          # Theme management
│   └── useQuestions.ts      # Questions fetching
├── lib/                     # Utilities and libraries
│   ├── questions.ts         # Q&A database
│   ├── auth.ts              # Auth utilities
│   ├── supabase.ts          # Supabase client
│   └── constants.ts         # App constants
└── types/                   # TypeScript type definitions
```

## 🎯 Important Questions (Exam Focus)

These 6 questions appear most frequently in driver's license exams:

1. **Q3**: Maximum speed limits (מהירות מרבית מותרת)
2. **Q6**: Overtaking rules (עקיפה)
3. **Q7**: Seatbelt requirements (חגורת בטיחות)
4. **Q10**: Left turns (פניות שמאלה)
5. **Q11**: New driver rules (נהג חדש)
6. **Q20**: U-turn procedures (פניית פרסה)

## 🔐 Authentication Flow

1. User clicks "Login with Gmail"
2. Redirected to Google OAuth consent screen
3. User grants permission
4. Callback stores/retrieves user in Supabase
5. Device ID generated and stored locally
6. Session token created with 90-day expiry
7. User auto-logged in on return visits (same device)
8. New device requires re-login

## 🎨 Theme System

The app supports three theme modes:

- **Light**: Bright, high-contrast design
- **Dark**: Reduces eye strain in low-light environments
- **Auto**: Follows system preferences (Windows/macOS)

Theme preference stored in localStorage and Supabase.

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All components tested on iPhone SE (375px) through 4K displays (3840px).

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

Tests include:
- Unit tests for utilities and hooks
- Component tests for UI interactions
- Integration tests for auth flow

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Set environment variables in Vercel settings
4. GitHub Actions automatically tests and deploys

```bash
# Deploy command (automatic)
npm run build && npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role for backend |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth secret |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `NEXT_PUBLIC_APP_URL` | Yes | App's public URL |

## 🔍 API Routes

- `POST /api/auth/login` - Login with Google code
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/questions` - Fetch all questions
- `GET /api/questions?important=true` - Fetch important questions

## 📦 File Size Limits

All components maintain the 250-line limit:

```bash
# Check file sizes
wc -l src/**/*.tsx src/**/*.ts

# Format all files to ensure consistency
npm run format
```

## 🐛 Troubleshooting

### Can't login with Gmail?
- Verify `GOOGLE_CLIENT_ID` is correct
- Check redirect URI matches in Google Cloud Console
- Ensure environment variables are loaded

### Session expires immediately?
- Check JWT_SECRET is consistent
- Verify Supabase session table exists
- Check browser cookies are enabled

### Styling looks broken?
- Run `npm run build`
- Clear browser cache (Cmd/Ctrl + Shift + Delete)
- Check Tailwind CSS is processing

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Detailed development guide
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [API Documentation](./docs/API.md) - API reference
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## ✉️ Contact & Support

- **Email**: support@traffic-qa-app.example.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/traffic-qa-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/traffic-qa-app/discussions)

## 🙏 Acknowledgments

- Questions compiled from Israeli traffic law materials
- Driving instructor training resources (מכללת סח'נין – כרמיאל)
- Tailwind CSS for styling framework
- Vercel for deployment platform

---

**Made with ❤️ for Israeli drivers preparing for their license exam**
