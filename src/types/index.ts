// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher';
  enrolledCourses: string[];
  createdAt: Date;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  color: string;
  progress: number;
  totalClasses: number;
  completedClasses: number;
  nextClass?: ScheduledClass;
  concepts: Concept[];
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  masteryLevel: number; // 0-100
}

// Schedule Types
export interface ScheduledClass {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'live' | 'completed';
  content?: ClassContent;
  quizAvailable: boolean;
}

export interface ClassContent {
  id: string;
  topics: string[];
  materials: Material[];
  notes: string;
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
}

// Assessment Types
export type AssessmentType = 'practice' | 'mock' | 'progress' | 'gap' | 'class-quiz';

export interface Assessment {
  id: string;
  type: AssessmentType;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  topics?: string[];
  questions: Question[];
  timeLimit?: number; // in minutes
  totalQuestions: number;
  status: 'available' | 'in-progress' | 'completed' | 'scheduled';
  scheduledAt?: Date;
  dueAt?: Date;
  createdAt: Date;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  estimatedTime?: number; // in minutes
}

// Quiz Types (keeping for backward compatibility)
export interface Quiz {
  id: string;
  classId: string;
  courseId: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  createdAt: Date;
  dueAt?: Date;
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  conceptId: string;
  conceptName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  topic?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  responses: QuestionResponse[];
  score: number;
  totalPoints: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  assessmentType: AssessmentType;
  userId: string;
  responses: QuestionResponse[];
  score: number;
  totalPoints: number;
  percentage: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
  conceptBreakdown: ConceptScore[];
  recommendations: string[];
}

export interface ConceptScore {
  conceptId: string;
  conceptName: string;
  correct: number;
  total: number;
  percentage: number;
  status: 'strong' | 'needs-work' | 'weak';
}

export interface QuestionResponse {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  timeSpent: number;
}

// Homework Types
export interface HomeworkDeck {
  id: string;
  courseId: string;
  classId: string;
  title: string;
  description: string;
  questions: HomeworkQuestion[];
  dueAt: Date;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
}

export interface HomeworkQuestion extends Question {
  category: 'current-mistakes' | 'past-mistakes' | 'new-concepts';
  isCompleted: boolean;
  attempts: number;
  lastAttemptCorrect?: boolean;
}

// Progress Types
export interface StudentProgress {
  userId: string;
  courseId: string;
  overallMastery: number;
  conceptMastery: Record<string, number>;
  quizScores: QuizScore[];
  homeworkCompletion: number;
  streakDays: number;
  totalTimeSpent: number;
  weakAreas: string[];
  strongAreas: string[];
  assessmentHistory: AssessmentHistoryItem[];
  gapTopics: GapTopic[];
}

export interface GapTopic {
  conceptId: string;
  conceptName: string;
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  lastAttempted?: Date;
}

export interface AssessmentHistoryItem {
  id: string;
  type: AssessmentType;
  title: string;
  score: number;
  totalPoints: number;
  percentage: number;
  completedAt: Date;
  timeSpent: number;
}

export interface QuizScore {
  quizId: string;
  score: number;
  totalPoints: number;
  completedAt: Date;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedQuestionId?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  homeworkId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// AI-Generated Assessment Types (from pupil-agents API)
export interface AIAssessment {
  id: string;
  job_id: string;
  status: 'completed' | 'failed' | 'pending';
  created_at: string | null;
  test_name: string | null;
  subject: string | null;
  test_type: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  topics: string[] | null;
  number_of_questions: number | null;
  estimated_time_minutes: number | null;
  total_marks: number | null;
}

export interface AIAssessmentDetail extends AIAssessment {
  question_ids: string[];
  request_params: any;
  questions: AIQuestion[];
}

export interface AIQuestion {
  _id: string;
  questionText: string;
  questionType: 'MCQ' | 'Integer' | 'Descriptive';
  origin: string;
  options: AIQuestionOption[];
  answer: AIQuestionAnswer;
  difficulty: 'easy' | 'medium' | 'hard';
  grade: string;
  topics: string[];
  learningOutcomes: string[];
  usageHistory: any[];
  statistics: {
    averageTimeSeconds: number;
    successRate: number;
    numberOfAttempts: number;
  };
  setId: string;
  created_at: string;
  updated_at: string;
  assessment_job_id: string;
  assessmentIds: string[];
}

export interface AIQuestionOption {
  key: string;
  text: string;
}

export interface AIQuestionAnswer {
  key: string | string[];
  explanation: string;
}

export interface AIAssessmentsResponse {
  assessments: AIAssessment[];
  count: number;
  limit: number;
  offset: number;
  type: 'teacher' | 'student';
}
