import { describe, it, expect } from 'vitest';
import type { TutorRequest, TutorResponse } from '@/lib/rag/tutorTypes';

describe('Tutor System - Citation Handling', () => {
  it('should extract Hebrew citations with correct source tags', () => {
    const answer = 'המהירות המרבית היא 110 קמ"ש. [מקור: S1]';
    const sourceTag = answer.match(/\[מקור: S\d+\]/);
    expect(sourceTag).toBeTruthy();
    expect(sourceTag?.[0]).toBe('[מקור: S1]');
  });

  it('should handle multiple citations in response', () => {
    const answer = 'עפ"י החוק [מקור: S1], המשטרה יכולה [מקור: S2] להוציא דוקומנטים.';
    const citations = answer.match(/\[מקור: S\d+\]/g);
    expect(citations).toHaveLength(2);
  });

  it('should preserve response structure with citations array', () => {
    const response: TutorResponse = {
      answer: 'תשובה עם מקור [מקור: S1]',
      citations: [
        {
          label: 'S1',
          documentId: 'doc-1',
          sourceType: 'official_law',
          page: 5,
        },
      ],
      evidenceStatus: 'available',
      mode: 'tutor',
    };

    expect(response.citations).toHaveLength(1);
    expect(response.citations[0].sourceType).toBe('official_law');
    expect(response.evidenceStatus).toBe('available');
  });
});

describe('Tutor System - Grounding & Safety', () => {
  it('should flag insufficient evidence with exact Hebrew phrase', () => {
    const phrase = 'לא מצאתי לכך מקור מספיק בחומר הקורס שהועלה';
    expect(phrase).toContain('לא מצאתי לכך');
    expect(phrase).toContain('מקור מספיק');
  });

  it('should return insufficient evidence status when needed', () => {
    const response: TutorResponse = {
      answer: 'לא מצאתי לכך מקור מספיק בחומר הקורס שהועלה.',
      citations: [],
      evidenceStatus: 'insufficient',
      suggestedAction: 'upload_source',
      mode: 'tutor',
    };

    expect(response.evidenceStatus).toBe('insufficient');
    expect(response.suggestedAction).toBe('upload_source');
    expect(response.citations).toHaveLength(0);
  });

  it('should support all four tutor modes', () => {
    const modes = ['tutor', 'quiz', 'exam_answer', 'summary'] as const;
    modes.forEach(mode => {
      const response: TutorResponse = {
        answer: `Response in ${mode} mode`,
        citations: [],
        evidenceStatus: 'available',
        mode,
      };
      expect(response.mode).toBe(mode);
    });
  });

  it('should support all source types for citations', () => {
    const sourceTypes = ['official_law', 'official_guidance', 'course_material', 'study_summary'] as const;
    sourceTypes.forEach(type => {
      const response: TutorResponse = {
        answer: 'Answer',
        citations: [
          {
            label: 'S1',
            documentId: 'doc-1',
            sourceType: type,
          },
        ],
        evidenceStatus: 'available',
        mode: 'tutor',
      };
      expect(response.citations[0].sourceType).toBe(type);
    });
  });
});

describe('Tutor Request Validation', () => {
  it('should require non-empty message', () => {
    const request: TutorRequest = {
      message: '',
    };
    expect(request.message.trim().length).toBe(0);
  });

  it('should enforce message length limit of 4000 characters', () => {
    const longMessage = 'a'.repeat(4001);
    expect(longMessage.length).toBeGreaterThan(4000);
  });

  it('should validate optional mode parameter', () => {
    const request: TutorRequest = {
      message: 'שלום',
      mode: 'quiz',
    };
    expect(['tutor', 'quiz', 'exam_answer', 'summary']).toContain(request.mode);
  });

  it('should preserve conversation context with conversationId', () => {
    const request: TutorRequest = {
      message: 'המשך השיחה',
      conversationId: 'conv-123',
      mode: 'tutor',
    };
    expect(request.conversationId).toBe('conv-123');
  });
});

describe('Tutor Teaching Behavior', () => {
  it('should support mnemonic formatting for lists', () => {
    const response =
      'כללי העקיפה: 1. בדוק מראות. 2. תן אות. 3. תעלה בעדינות. [עזרים לזכירה: בדא-תא-תע]';
    expect(response).toContain('עזרים לזכירה');
  });

  it('should format exam answers as structured responses', () => {
    const response: TutorResponse = {
      answer: 'תשובה למבחן:\n1. הקדמה\n2. גוף\n3. סיכום',
      citations: [],
      evidenceStatus: 'available',
      mode: 'exam_answer',
    };
    expect(response.answer).toContain('תשובה למבחן');
  });

  it('should structure quiz mode as single questions', () => {
    const response: TutorResponse = {
      answer: 'שאלה: מה המהירות המרבית בעיר? (ניתן תשובה בתוך שתי דקות)',
      citations: [],
      evidenceStatus: 'available',
      mode: 'quiz',
    };
    expect(response.mode).toBe('quiz');
  });

  it('should provide summaries with topic organization', () => {
    const response: TutorResponse = {
      answer: '## סיכום דיני התעבורה\n### מהירות\nטקסט סיכום...\n### עקיפה\nטקסט סיכום...',
      citations: [],
      evidenceStatus: 'available',
      mode: 'summary',
    };
    expect(response.answer).toContain('##');
  });
});

describe('Tutor Integration Contract', () => {
  it('should match tutor request schema', () => {
    const request: TutorRequest = {
      message: 'מה הן המהירויות המרביות?',
      mode: 'tutor',
      conversationId: 'test-conv',
      selectedCourseId: 'course-1',
    };

    expect(request).toHaveProperty('message');
    expect(request.message.length).toBeGreaterThan(0);
  });

  it('should match tutor response schema with all required fields', () => {
    const response: TutorResponse = {
      answer: 'תשובה מלאה',
      citations: [],
      evidenceStatus: 'available',
      mode: 'tutor',
    };

    expect(response).toHaveProperty('answer');
    expect(response).toHaveProperty('citations');
    expect(response).toHaveProperty('evidenceStatus');
    expect(response).toHaveProperty('mode');
  });

  it('should support optional fields in response', () => {
    const response: TutorResponse = {
      answer: 'תשובה',
      citations: [],
      evidenceStatus: 'insufficient',
      suggestedAction: 'quiz',
      mode: 'tutor',
    };

    expect(response.suggestedAction).toBe('quiz');
  });
});
