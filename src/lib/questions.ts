import { TRAFFIC_LAWS_QUESTIONS } from './traffic-law-questions';

export interface Question {
  id: number;
  hebrew: string;
  english: string;
  answer: string;
  category: string;
  important: boolean;
  examFrequency: number;
}

export interface Course {
  id: string;
  name: string;
  hebrewName: string;
  description: string;
  questions: Question[];
}

// Backward compatibility
export const QUESTIONS = TRAFFIC_LAWS_QUESTIONS;

export const getQuestionById = (id: number): Question | undefined => {
  return TRAFFIC_LAWS_QUESTIONS.find(q => q.id === id);
};

export const getImportantQuestions = (): Question[] => {
  return TRAFFIC_LAWS_QUESTIONS.filter(q => q.important).sort((a, b) => b.examFrequency - a.examFrequency);
};

export const getQuestionsByCategory = (category: string): Question[] => {
  return TRAFFIC_LAWS_QUESTIONS.filter(q => q.category === category);
};

export const getCategories = (): string[] => {
  return [...new Set(TRAFFIC_LAWS_QUESTIONS.map(q => q.category))];
};

// Courses structure
export const COURSES: Course[] = [
  {
    id: 'traffic-laws',
    name: 'Traffic Laws',
    hebrewName: 'דיני תעבורה',
    description: 'Israeli traffic laws and regulations',
    questions: TRAFFIC_LAWS_QUESTIONS,
  },
  {
    id: 'licensing-procedures',
    name: 'Licensing Procedures',
    hebrewName: 'נהלי רישוי',
    description: 'Driver licensing procedures and requirements',
    questions: [],
  },
];

// Export for QuestionCard component (for backward compatibility)
export const TRAFFIC_LAW_QUESTIONS_FORMATTED = TRAFFIC_LAWS_QUESTIONS.map(q => ({
  id: q.id,
  question: q.hebrew,
  answer: q.answer,
  priority: q.important,
}));

export const getCourseByCourseId = (courseId: string): Course | undefined => {
  return COURSES.find(c => c.id === courseId);
};

export const getCourseQuestions = (courseId: string) => {
  const course = getCourseByCourseId(courseId);
  return course ? course.questions.map(q => ({
    id: q.id,
    question: q.hebrew,
    answer: q.answer,
    priority: q.important,
  })) : [];
};
