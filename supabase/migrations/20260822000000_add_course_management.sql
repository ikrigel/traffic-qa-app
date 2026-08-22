-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course materials (lessons/resources)
CREATE TABLE course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  material_type TEXT CHECK (material_type IN ('lesson', 'resource', 'video', 'document')),
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Link questions to courses (many-to-many)
CREATE TABLE course_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  order_index INT DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX idx_course_materials_order ON course_materials(course_id, order_index);
CREATE INDEX idx_course_questions_course_id ON course_questions(course_id);
CREATE INDEX idx_course_questions_question_id ON course_questions(question_id);
