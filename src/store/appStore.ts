import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  User, 
  Course, 
  ScheduledClass, 
  Quiz, 
  QuizAttempt, 
  HomeworkDeck,
  ChatMessage,
  StudentProgress,
  Assessment,
  AssessmentAttempt
} from '@/types';

interface AppState {
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  
  // Course State
  courses: Course[];
  activeCourse: Course | null;
  
  // Schedule State
  schedule: ScheduledClass[];
  activeClass: ScheduledClass | null;
  
  // Assessment State
  assessments: Assessment[];
  activeAssessment: Assessment | null;
  currentAssessmentAttempt: AssessmentAttempt | null;
  
  // Quiz State (legacy)
  activeQuiz: Quiz | null;
  currentQuizAttempt: QuizAttempt | null;
  currentQuestionIndex: number;
  
  // Homework State
  homeworkDecks: HomeworkDeck[];
  activeHomework: HomeworkDeck | null;
  
  // Chat State
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  
  // Progress State
  progress: StudentProgress | null;
  
  // Loading States
  isLoading: boolean;
  loadingMessage: string;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  setCourses: (courses: Course[]) => void;
  setActiveCourse: (course: Course | null) => void;
  
  setSchedule: (schedule: ScheduledClass[]) => void;
  setActiveClass: (classItem: ScheduledClass | null) => void;
  
  // Assessment Actions
  setAssessments: (assessments: Assessment[]) => void;
  startAssessment: (assessment: Assessment) => void;
  setAssessmentAttempt: (attempt: AssessmentAttempt | null) => void;
  resetAssessment: () => void;
  
  // Quiz Actions (legacy)
  startQuiz: (quiz: Quiz) => void;
  submitAnswer: (answer: string | number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeQuiz: () => QuizAttempt | null;
  resetQuiz: () => void;
  
  setHomeworkDecks: (decks: HomeworkDeck[]) => void;
  setActiveHomework: (homework: HomeworkDeck | null) => void;
  
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  toggleChat: () => void;
  
  setProgress: (progress: StudentProgress) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        courses: [],
        activeCourse: null,
        schedule: [],
        activeClass: null,
        assessments: [],
        activeAssessment: null,
        currentAssessmentAttempt: null,
        activeQuiz: null,
        currentQuizAttempt: null,
        currentQuestionIndex: 0,
        homeworkDecks: [],
        activeHomework: null,
        chatMessages: [],
        isChatOpen: false,
        progress: null,
        isLoading: false,
        loadingMessage: '',

        // Auth Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        login: async (email, password) => {
          set({ isLoading: true, loadingMessage: 'Signing in...' });
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: '1',
            name: 'Alex Johnson',
            email: email,
            avatar: undefined,
            role: 'student',
            enrolledCourses: ['course-1', 'course-2', 'course-3'],
            createdAt: new Date(),
          };
          
          set({ 
            user: mockUser, 
            isAuthenticated: true, 
            isLoading: false,
            loadingMessage: '' 
          });
          return true;
        },
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false,
          courses: [],
          activeCourse: null,
          activeQuiz: null,
          currentQuizAttempt: null,
          activeAssessment: null,
          currentAssessmentAttempt: null,
          chatMessages: [],
        }),

        // Course Actions
        setCourses: (courses) => set({ courses }),
        setActiveCourse: (course) => set({ activeCourse: course }),

        // Schedule Actions
        setSchedule: (schedule) => set({ schedule }),
        setActiveClass: (classItem) => set({ activeClass: classItem }),

        // Assessment Actions
        setAssessments: (assessments) => set({ assessments }),
        startAssessment: (assessment) => set({ 
          activeAssessment: assessment,
          currentQuestionIndex: 0 
        }),
        setAssessmentAttempt: (attempt) => set({ currentAssessmentAttempt: attempt }),
        resetAssessment: () => set({
          activeAssessment: null,
          currentAssessmentAttempt: null,
          currentQuestionIndex: 0,
        }),

        // Quiz Actions
        startQuiz: (quiz) => {
          const attempt: QuizAttempt = {
            id: `attempt-${Date.now()}`,
            quizId: quiz.id,
            userId: get().user?.id || '',
            responses: [],
            score: 0,
            totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
            startedAt: new Date(),
            timeSpent: 0,
          };
          set({ 
            activeQuiz: quiz, 
            currentQuizAttempt: attempt,
            currentQuestionIndex: 0 
          });
        },
        
        submitAnswer: (answer) => {
          const { activeQuiz, currentQuizAttempt, currentQuestionIndex } = get();
          if (!activeQuiz || !currentQuizAttempt) return;
          
          const question = activeQuiz.questions[currentQuestionIndex];
          const isCorrect = answer === question.correctAnswer;
          
          const response = {
            questionId: question.id,
            answer,
            isCorrect,
            timeSpent: 0,
          };
          
          const updatedResponses = [...currentQuizAttempt.responses];
          const existingIndex = updatedResponses.findIndex(
            r => r.questionId === question.id
          );
          
          if (existingIndex >= 0) {
            updatedResponses[existingIndex] = response;
          } else {
            updatedResponses.push(response);
          }
          
          const score = updatedResponses.reduce((sum, r) => {
            if (r.isCorrect) {
              const q = activeQuiz.questions.find(q => q.id === r.questionId);
              return sum + (q?.points || 0);
            }
            return sum;
          }, 0);
          
          set({
            currentQuizAttempt: {
              ...currentQuizAttempt,
              responses: updatedResponses,
              score,
            },
          });
        },
        
        nextQuestion: () => {
          const { activeQuiz, currentQuestionIndex } = get();
          if (!activeQuiz) return;
          
          if (currentQuestionIndex < activeQuiz.questions.length - 1) {
            set({ currentQuestionIndex: currentQuestionIndex + 1 });
          }
        },
        
        previousQuestion: () => {
          const { currentQuestionIndex } = get();
          if (currentQuestionIndex > 0) {
            set({ currentQuestionIndex: currentQuestionIndex - 1 });
          }
        },
        
        completeQuiz: () => {
          const { currentQuizAttempt } = get();
          if (!currentQuizAttempt) return null;
          
          const completedAttempt: QuizAttempt = {
            ...currentQuizAttempt,
            completedAt: new Date(),
            timeSpent: Math.floor(
              (new Date().getTime() - currentQuizAttempt.startedAt.getTime()) / 1000
            ),
          };
          
          set({ currentQuizAttempt: completedAttempt });
          return completedAttempt;
        },
        
        resetQuiz: () => set({
          activeQuiz: null,
          currentQuizAttempt: null,
          currentQuestionIndex: 0,
        }),

        // Homework Actions
        setHomeworkDecks: (decks) => set({ homeworkDecks: decks }),
        setActiveHomework: (homework) => set({ activeHomework: homework }),

        // Chat Actions
        addChatMessage: (message) => {
          const newMessage: ChatMessage = {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
          };
          set((state) => ({
            chatMessages: [...state.chatMessages, newMessage],
          }));
        },
        
        clearChat: () => set({ chatMessages: [] }),
        toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

        // Progress Actions
        setProgress: (progress) => set({ progress }),
        
        // Loading Actions
        setLoading: (isLoading, message = '') => 
          set({ isLoading, loadingMessage: message }),
      }),
      {
        name: 'edulearn-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
