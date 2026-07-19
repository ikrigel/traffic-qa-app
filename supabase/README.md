# Supabase Schema Management

This directory contains all database schema migrations for the Traffic Laws Q&A App.

## Structure

```
supabase/
├── migrations/        # SQL migration files (version-controlled)
├── config.toml       # Supabase configuration
└── README.md         # This file
```

## Migration Files

Migration files are named with timestamps: `YYYYMMDDHHMMSS_description.sql`

Each migration should be idempotent (safe to run multiple times) using `IF NOT EXISTS` and `IF NOT EXISTS` clauses.

### Creating New Migrations

1. Create a new SQL file in `supabase/migrations/` with timestamp + description:
   ```bash
   touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_new_table.sql
   ```

2. Write your migration using idempotent SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. Commit and push to GitHub:
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add new_table migration"
   git push
   ```

4. GitHub Actions automatically deploys to Supabase

## Local Development

### Push migrations to local Supabase
```bash
supabase db push
```

### Pull schema from remote Supabase
```bash
supabase db pull
```

### Create a diff
```bash
supabase db diff <migration_name>
```

## Required GitHub Secrets

To enable automatic deployments, add these secrets to your GitHub repository settings:

- `SUPABASE_ACCESS_TOKEN` - Get from https://app.supabase.com/account/tokens
- `SUPABASE_PROJECT_ID` - Your Supabase project ID
- `SUPABASE_DB_URL` - Your Supabase database URL (postgresql://...)

## Deployment Process

1. **Local Testing**: Test migrations locally with `supabase db push`
2. **Git Push**: Commit and push to main branch
3. **Auto-Deploy**: GitHub Actions automatically deploys to Supabase production
4. **Verification**: Check Supabase dashboard or GitHub Actions logs

## Schema Overview

### Current Tables

#### users
- `id` (UUID) - Primary key
- `email` (TEXT) - Unique email address
- `name` (TEXT) - User's name
- `created_at` (TIMESTAMP) - Account creation date
- `last_login` (TIMESTAMP) - Last login timestamp
- `theme` (TEXT) - Theme preference (auto/light/dark)
- `show_answers` (BOOLEAN) - Show answers toggle

#### sessions
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `device_id` (TEXT) - Device fingerprint
- `token` (TEXT) - Session token
- `created_at` (TIMESTAMP) - Session creation
- `expires_at` (TIMESTAMP) - 90-day expiry

## Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Sessions are device-specific
- Policies enforce user isolation

## Rollback

If a migration causes issues:

1. Create a new migration to fix/revert:
   ```sql
   -- supabase/migrations/YYYYMMDDHHMMSS_revert_issue.sql
   ```

2. Push the fix to GitHub
3. Auto-deployment will apply the fix

Never manually edit or delete migration files after they're pushed to main.
