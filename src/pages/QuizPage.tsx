import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CBTExamInterface } from '@/components/exam/CBTExamInterface';
import { 
  Loader2, 
  CheckCircle, 
  XCircle,
  Sparkles,
  ArrowRight,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz } from '@/types';

interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  responses: Array<{
    questionId: string;
    selectedAnswer: number | null;
    isCorrect: boolean;
  }>;
}

export default function QuizPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, resetQuiz } = useAppStore();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadQuiz = async () => {
      if (!classId) return;
      setIsLoading(true);
      try {
        const quizData = await api.getQuizForClass(classId);
        setQuiz(quizData);
      } catch (error) {
        console.error('Failed to load quiz:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
    return () => resetQuiz();
  }, [classId, isAuthenticated, navigate, resetQuiz]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Quiz not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (answers: Record<string, number | null>, timeTaken: number) => {
    let score = 0;
    let totalPoints = 0;
    const responses = quiz.questions.map(q => {
      totalPoints += q.points;
      const selectedAnswer = answers[q.id];
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) score += q.points;
      return { questionId: q.id, selectedAnswer, isCorrect };
    });
    
    setResult({
      score,
      totalPoints,
      percentage: Math.round((score / totalPoints) * 100),
      timeTaken,
      responses
    });
  };

  const handleExit = () => {
    resetQuiz();
    navigate('/dashboard');
  };

  // Show result view
  if (result) {
    const correctCount = result.responses.filter(r => r.isCorrect).length;
    
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden animate-scale-in">
            <div className={cn(
              "p-8 text-center",
              result.percentage >= 70 ? "bg-success/10" : "bg-warning/10"
            )}>
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                result.percentage >= 70 ? "bg-success" : "bg-warning"
              )}>
                {result.percentage >= 70 ? (
                  <CheckCircle className="w-10 h-10 text-success-foreground" />
                ) : (
                  <Sparkles className="w-10 h-10 text-warning-foreground" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {result.percentage >= 70 ? 'Great Job!' : 'Keep Practicing!'}
              </h1>
              <p className="text-muted-foreground">
                You've completed the quiz
              </p>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-foreground mb-2">{result.percentage}%</p>
                <p className="text-muted-foreground">
                  {correctCount} of {quiz.questions.length} questions correct
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Time taken: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Question Review</h3>
                <div className="grid grid-cols-5 gap-2">
                  {quiz.questions.map((q, i) => {
                    const response = result.responses.find(r => r.questionId === q.id);
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "h-10 rounded-lg flex items-center justify-center text-sm font-medium",
                          response?.isCorrect 
                            ? "bg-success/10 text-success border border-success/20" 
                            : "bg-error/10 text-error border border-error/20"
                        )}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => navigate('/dashboard')}
                >
                  <Home className="w-4 h-4" />
                  Back to Dashboard
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => navigate('/homework')}
                >
                  Start Homework
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CBTExamInterface
      title={quiz.title}
      questions={quiz.questions}
      timeLimit={quiz.timeLimit}
      onSubmit={handleSubmit}
      onExit={handleExit}
      showInstantFeedback={true}
      enableSecurity={true}
      maxViolations={3}
    />
  );
}
