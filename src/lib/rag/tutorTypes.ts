/**
 * Types for the Hebrew Driving Instructor RAG Tutor system
 * Defines request/response contracts, citations, and retrieval metadata
 */

export type TutorMode = 'tutor' | 'quiz' | 'exam_answer' | 'summary';

export type SourceType = 'official_law' | 'official_guidance' | 'course_material' | 'study_summary';

export interface RagCitation {
  documentId: string;
  title: string;
  page?: number;
  section?: string;
  sourceType: SourceType;
  effectiveDate?: string;
  url?: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  citation: RagCitation;
}

export interface TutorRequest {
  message: string;
  conversationId?: string;
  mode?: TutorMode;
  selectedCourseId?: string;
}

export interface TutorResponse {
  answer: string;
  citations: Array<{
    label: string;
    documentId: string;
    page?: number;
    section?: string;
    sourceType: SourceType;
  }>;
  evidenceStatus: 'available' | 'insufficient';
  suggestedAction?: 'quiz' | 'continue' | 'upload_source';
  mode: TutorMode;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  insufficientEvidence: boolean;
  totalRetrieved: number;
  retrievalScore: number;
}

export interface DocumentMetadata {
  documentId: string;
  title: string;
  page?: number;
  section?: string;
  courseId?: string;
  sourceType: SourceType;
  publishedAt?: Date;
  effectiveDate?: Date;
  language: 'he' | 'en';
  isActive: boolean;
  supersededBy?: string;
  topicTags: string[];
  url?: string;
}
