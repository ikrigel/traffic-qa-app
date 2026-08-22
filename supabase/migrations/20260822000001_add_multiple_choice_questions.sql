-- Admin-created questions (supports multiple choice and free text)
CREATE TABLE admin_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('free_text', 'multiple_choice')) DEFAULT 'free_text',
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Multiple choice options for admin questions
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES admin_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Allow linking admin questions to courses as well
CREATE TABLE IF NOT EXISTS course_admin_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  admin_question_id UUID NOT NULL REFERENCES admin_questions(id) ON DELETE CASCADE,
  order_index INT DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_questions_is_published ON admin_questions(is_published);
CREATE INDEX idx_admin_questions_category ON admin_questions(category);
CREATE INDEX idx_admin_questions_created_by ON admin_questions(created_by);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_course_admin_questions_course_id ON course_admin_questions(course_id);
