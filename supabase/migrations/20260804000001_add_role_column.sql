-- Add role column to users table with CHECK constraint
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Self-heal super admin
UPDATE users SET role = 'super_admin' WHERE email = 'ikrigel@gmail.com';
