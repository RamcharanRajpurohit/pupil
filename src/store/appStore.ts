import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { API_ENDPOINTS } from '@/config/api';
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
          
          try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username: email, password }),
            });

            if (!response.ok) {
              const error = await response.json();
              console.error('Login failed:', error);
              set({ isLoading: false, loadingMessage: '' });
              return false;
            }

            const userData = await response.json();
            // Response directly contains user data from /users/login_with_credentials
            // Token is not provided in current API version
            const token = null;
            // Map the API response to our User type
            const user: User = {
              id: userData._id || userData.id,
              name: userData.name,
              email: userData.email,
              avatar: userData.photoUrl || userData.photo_url || undefined,
              role: userData.role || 'student',
              enrolledCourses: [], // Will be populated when we have that endpoint
              createdAt: new Date(userData.created_at || userData.createdAt || new Date()),
              // Store additional profile data
              profile: userData.profile,
              institutionId: userData.institution_id || userData.institutionId,
              status: userData.status,
            };

            // Store token in localStorage for future requests (only if it exists)
            if (token && token !== 'null' && token !== 'undefined') {
              localStorage.setItem('auth_token', token);
            } else {
              // Clear any existing token if API returns null
              localStorage.removeItem('auth_token');
            }
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              loadingMessage: '' 
            });
            return true;
          } catch (error) {
            console.error('Login error:', error);
            set({ isLoading: false, loadingMessage: '' });
            return false;
          }
        },
        
        logout: () => {
          // Clear stored token
          localStorage.removeItem('auth_token');
          
          set({ 
            user: null, 
            isAuthenticated: false,
            courses: [],
            activeCourse: null,
            activeQuiz: null,
            currentQuizAttempt: null,
            activeAssessment: null,
            currentAssessmentAttempt: null,
            chatMessages: [],
          });
        },

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
