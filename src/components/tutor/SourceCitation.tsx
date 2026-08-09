'use client';

import type { TutorResponse } from '@/lib/rag/tutorTypes';

interface SourceCitationProps {
  citations: TutorResponse['citations'];
}

export default function SourceCitation({ citations }: SourceCitationProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-300">
      <p className="text-sm font-semibold text-gray-700 mb-2">📚 מקורות:</p>
      <ul className="space-y-1">
        {citations.map((citation, idx) => (
          <li key={idx} className="text-sm text-gray-600">
            <span className="font-medium">{citation.label}:</span> {citation.sourceType === 'official_law' && '⚖️ '} {citation.sourceType === 'official_guidance' && '📋 '} {citation.sourceType === 'course_material' && '📚 '} {citation.section || `עמ׳ ${citation.page || 'N/A'}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
