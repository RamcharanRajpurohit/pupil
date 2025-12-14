import type { 
  Course, 
  ScheduledClass, 
  Quiz, 
  HomeworkDeck, 
  StudentProgress,
  ChatMessage,
  Assessment,
  AssessmentAttempt,
  Question
} from '@/types';
import { 
  mockCourses, 
  mockSchedule, 
  mockQuiz, 
  mockHomeworkDeck, 
  mockProgress,
  mockAssessments,
  questionBank
} from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Service - Mimics real API calls with mock data
export const api = {
  // Courses
  async getCourses(): Promise<Course[]> {
    await delay(500);
    return mockCourses;
  },

  async getCourse(id: string): Promise<Course | null> {
    await delay(300);
    return mockCourses.find(c => c.id === id) || null;
  },

  // Schedule
  async getSchedule(): Promise<ScheduledClass[]> {
    await delay(400);
    return mockSchedule;
  },

  async getClassById(id: string): Promise<ScheduledClass | null> {
    await delay(300);
    return mockSchedule.find(c => c.id === id) || null;
  },

  async getClassesByCourse(courseId: string): Promise<ScheduledClass[]> {
    await delay(400);
    return mockSchedule.filter(c => c.courseId === courseId);
  },

  async getTodaysClasses(): Promise<ScheduledClass[]> {
    await delay(300);
    const today = new Date();
    return mockSchedule.filter(c => {
      const classDate = new Date(c.startTime);
      return classDate.toDateString() === today.toDateString();
    });
  },

  // Assessments
  async getAssessments(): Promise<Assessment[]> {
    await delay(400);
    return mockAssessments;
  },

  async getAssessmentsByType(type: string): Promise<Assessment[]> {
    await delay(300);
    return mockAssessments.filter(a => a.type === type);
  },

  async getAssessment(id: string): Promise<Assessment | null> {
    await delay(300);
    return mockAssessments.find(a => a.id === id) || null;
  },

  async getAvailableTopics(courseId?: string): Promise<string[]> {
    await delay(200);
    const concepts = courseId 
      ? mockCourses.find(c => c.id === courseId)?.concepts || []
      : mockCourses.flatMap(c => c.concepts);
    return [...new Set(concepts.map(c => c.name))];
  },

  async generatePracticeTest(topics: string[], questionCount: number, difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'): Promise<Assessment> {
    await delay(800);
    let filteredQuestions = questionBank.filter(q => 
      topics.includes(q.conceptName) || topics.includes(q.topic || '')
    );
    
    // Filter by difficulty if not mixed
    if (difficulty !== 'mixed') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // If no questions match the difficulty, fall back to all matching topics
    if (filteredQuestions.length === 0) {
      filteredQuestions = questionBank.filter(q => 
        topics.includes(q.conceptName) || topics.includes(q.topic || '')
      );
    }
    
    // Shuffle and take requested number of questions
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    
    return {
      id: `practice-${Date.now()}`,
      type: 'practice',
      title: `Practice: ${topics.slice(0, 2).join(', ')}${topics.length > 2 ? '...' : ''}`,
      description: `Custom practice test on selected topics`,
      topics,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      status: 'available',
      createdAt: new Date(),
      difficulty,
      estimatedTime: selectedQuestions.length * 2,
    };
  },

  async submitAssessmentAttempt(
    assessmentId: string, 
    responses: { questionId: string; answer: string | number }[],
    assessment?: Assessment
  ): Promise<AssessmentAttempt> {
    await delay(1000);
    
    // Use provided assessment or find it in mockAssessments
    const targetAssessment = assessment || mockAssessments.find(a => a.id === assessmentId);
    if (!targetAssessment) throw new Error('Assessment not found');

    const processedResponses = responses.map(r => {
      const question = targetAssessment.questions.find(q => q.id === r.questionId);
      const isCorrect = question ? r.answer === question.correctAnswer : false;
      return {
        questionId: r.questionId,
        answer: r.answer,
        isCorrect,
        timeSpent: Math.floor(Math.random() * 60) + 30,
      };
    });

    const score = processedResponses.filter(r => r.isCorrect).length;
    const totalPoints = targetAssessment.questions.length;
    const percentage = Math.round((score / totalPoints) * 100);

    // Calculate concept breakdown
    const conceptScores = new Map<string, { correct: number; total: number; name: string }>();
    targetAssessment.questions.forEach(q => {
      if (!conceptScores.has(q.conceptId)) {
        conceptScores.set(q.conceptId, { correct: 0, total: 0, name: q.conceptName });
      }
      const cs = conceptScores.get(q.conceptId)!;
      cs.total++;
      const response = processedResponses.find(r => r.questionId === q.id);
      if (response?.isCorrect) cs.correct++;
    });

    const conceptBreakdown = Array.from(conceptScores.entries()).map(([id, data]) => ({
      conceptId: id,
      conceptName: data.name,
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100),
      status: (data.correct / data.total >= 0.7 ? 'strong' : data.correct / data.total >= 0.5 ? 'needs-work' : 'weak') as 'strong' | 'needs-work' | 'weak',
    }));

    // Generate recommendations
    const weakConcepts = conceptBreakdown.filter(c => c.status === 'weak').map(c => c.conceptName);
    const recommendations = weakConcepts.length > 0
      ? [`Focus on: ${weakConcepts.join(', ')}`, 'Complete gap analysis tests for weak areas', 'Review related class materials']
      : ['Great job! Try harder problems', 'Take a mock test to challenge yourself'];

    return {
      id: `attempt-${Date.now()}`,
      assessmentId,
      assessmentType: targetAssessment.type,
      userId: '1',
      responses: processedResponses,
      score,
      totalPoints,
      percentage,
      startedAt: new Date(Date.now() - 600000),
      completedAt: new Date(),
      timeSpent: 600,
      conceptBreakdown,
      recommendations,
    };
  },

  // Quizzes (keeping for backward compatibility)
  async getQuizForClass(classId: string): Promise<Quiz | null> {
    await delay(500);
    if (classId === 'class-1') {
      return mockQuiz;
    }
    return null;
  },

  async submitQuizAttempt(quizId: string, responses: any[]): Promise<{ success: boolean; score: number }> {
    await delay(800);
    const score = Math.floor(Math.random() * 30) + 70;
    return { success: true, score };
  },

  // Homework
  async getHomeworkDecks(): Promise<HomeworkDeck[]> {
    await delay(400);
    return [mockHomeworkDeck];
  },

  async getHomeworkDeck(id: string): Promise<HomeworkDeck | null> {
    await delay(300);
    if (id === 'hw-1') {
      return mockHomeworkDeck;
    }
    return null;
  },

  async submitHomeworkAnswer(homeworkId: string, questionId: string, answer: string): Promise<{
    isCorrect: boolean;
    explanation: string;
  }> {
    await delay(600);
    const isCorrect = Math.random() > 0.3;
    return {
      isCorrect,
      explanation: isCorrect 
        ? 'Great job! Your approach is correct.' 
        : 'Not quite right. Let\'s review the concept together.',
    };
  },

  // Progress
  async getStudentProgress(courseId?: string): Promise<StudentProgress> {
    await delay(400);
    return mockProgress;
  },

  // AI Chat
  async sendChatMessage(message: string, context?: { 
    homeworkId?: string; 
    questionId?: string;
  }): Promise<ChatMessage> {
    await delay(1000);
    
    let response = '';
    
    if (message.toLowerCase().includes('help') || message.toLowerCase().includes('stuck')) {
      response = "I understand you're having trouble with this problem. Let's break it down step by step. First, what do you notice about the structure of the expression? Try identifying the key components before we proceed.";
    } else if (message.toLowerCase().includes('hint')) {
      response = "Here's a hint: Consider what technique might be most useful here. Look at the form of the integrand - does it remind you of any standard patterns we've covered? What would happen if you tried grouping terms differently?";
    } else if (message.toLowerCase().includes('explain')) {
      response = "Let me explain the underlying concept. The key insight here is understanding how the fundamental theorem connects differentiation and integration. When we have a product of functions, we need to think about which function becomes simpler when differentiated.";
    } else {
      response = "That's a good question! Think about what we learned in class today. The key is to identify the pattern and apply the appropriate technique. What's the first step you would take to approach this problem?";
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
  },

  // Generate Questions (AI mock)
  async generateQuestions(classId: string, content: string): Promise<Quiz> {
    await delay(2000);
    return mockQuiz;
  },

  // Generate Homework Deck (AI mock)
  async generateHomeworkDeck(classId: string, quizResults: any): Promise<HomeworkDeck> {
    await delay(2000);
    return mockHomeworkDeck;
  },
};
