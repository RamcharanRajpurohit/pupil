import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CBTExamInterface } from '@/components/exam/CBTExamInterface';
import { 
  Loader2, CheckCircle, Home, ArrowRight, BarChart3, Clock, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assessment, AssessmentAttempt } from '@/types';

export default function AssessmentPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, startAssessment, resetAssessment } = useAppStore();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    
    // Check if assessment was passed via location state (for generated practice tests)
    if (location.state?.assessment) {
      const passedAssessment = location.state.assessment as Assessment;
      setAssessment(passedAssessment);
      startAssessment(passedAssessment);
      setIsLoading(false);
      return;
    }
    
    loadAssessment();
    return () => resetAssessment();
  }, [assessmentId, isAuthenticated]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    setIsLoading(true);
    const data = await api.getAssessment(assessmentId);
    if (data) { setAssessment(data); startAssessment(data); }
    setIsLoading(false);
  };

  const handleSubmit = async (answers: Record<string, number | null>, timeTaken: number) => {
    if (!assessment) return;
    setIsLoading(true);
    const responses = Object.entries(answers).map(([questionId, answer]) => ({ 
      questionId, 
      answer: answer ?? -1 
    }));
    const attempt = await api.submitAssessmentAttempt(assessment.id, responses, assessment);
    setResult(attempt);
    
    // Update practice test history with results
    const history = JSON.parse(localStorage.getItem('practiceTestHistory') || '[]');
    const updatedHistory = history.map((item: any) => {
      if (item.id === assessment.id) {
        return {
          ...item,
          completedAt: new Date().toISOString(),
          score: attempt.score,
          percentage: attempt.percentage,
        };
      }
      return item;
    });
    localStorage.setItem('practiceTestHistory', JSON.stringify(updatedHistory));
    
    setIsLoading(false);
  };

  const handleExit = () => {
    resetAssessment();
    navigate('/assessments');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Assessment not found</p>
          <Button onClick={() => navigate('/assessments')}>Back to Assessments</Button>
        </div>
      </div>
    );
  }

  // Results View
  if (result) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <div className={cn("p-8 text-center", result.percentage >= 70 ? "bg-success/10" : "bg-warning/10")}>
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4", result.percentage >= 70 ? "bg-success" : "bg-warning")}>
                {result.percentage >= 70 ? <CheckCircle className="w-10 h-10 text-success-foreground" /> : <BarChart3 className="w-10 h-10 text-warning-foreground" />}
              </div>
              <h1 className="text-3xl font-bold mb-2">{result.percentage}%</h1>
              <p className="text-muted-foreground">{result.score} of {result.totalPoints} points</p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Concept Breakdown</h3>
                <div className="space-y-2">
                  {result.conceptBreakdown.map(c => (
                    <div key={c.conceptId} className="flex items-center justify-between text-sm">
                      <span>{c.conceptName}</span>
                      <Badge className={cn(c.status === 'strong' ? 'bg-success/10 text-success' : c.status === 'weak' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning')}>
                        {c.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
                  <Home className="w-4 h-4 mr-2" />Dashboard
                </Button>
                <Button className="flex-1" onClick={() => navigate('/assessments')}>
                  More Tests<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Instructions screen before starting exam
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Badge className="w-fit mb-2">{assessment.type.replace('-', ' ').toUpperCase()}</Badge>
              <CardTitle className="text-2xl">{assessment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="font-semibold">{assessment.questions.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{assessment.timeLimit || 30} minutes</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Instructions</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• This test follows NTA CBT exam pattern.</li>
                  <li>• The timer will start once you begin and cannot be paused.</li>
                  <li>• Use the question palette to navigate between questions.</li>
                  <li>• You can mark questions for review and revisit them later.</li>
                  <li>• Unanswered questions will be marked in red.</li>
                  <li>• The test will auto-submit when time runs out.</li>
                  <li>• Make sure you have a stable internet connection.</li>
                </ul>
              </div>

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Once you start, the timer cannot be paused. Make sure you're ready!
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/assessments')}>
                  Back
                </Button>
                <Button className="flex-1" size="lg" onClick={() => setExamStarted(true)}>
                  Start Test
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
      title={assessment.title}
      questions={assessment.questions}
      timeLimit={assessment.timeLimit || 30}
      onSubmit={handleSubmit}
      onExit={handleExit}
      showInstantFeedback={false}
    />
  );
}
