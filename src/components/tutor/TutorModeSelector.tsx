'use client';

import type { TutorMode } from '@/lib/rag/tutorTypes';

interface TutorModeSelectorProps {
  mode: TutorMode;
  onModeChange: (mode: TutorMode) => void;
}

export default function TutorModeSelector({ mode, onModeChange }: TutorModeSelectorProps) {
  const modes: { id: TutorMode; label: string; description: string }[] = [
    { id: 'tutor', label: '📚 מדריך', description: 'הסברים מלאים ודוגמאות' },
    { id: 'quiz', label: '🎯 חידון', description: 'שאלה אחת בכל פעם' },
    { id: 'exam_answer', label: '✍️ תשובת בחינה', description: 'תשובה עבור בחינה' },
    { id: 'summary', label: '📋 סיכום', description: 'סיכום של הנושא' },
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {modes.map(({ id, label, description }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            mode === id
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title={description}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
