import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopicSelectionDialog } from '@/components/assessments/TopicSelectionDialog';
import { FileUploadQuizDialog } from '@/components/assessments/FileUploadQuizDialog';
import { PracticeTestHistory } from '@/components/assessments/PracticeTestHistory';
import { 
  FileText, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Play,
  Calendar,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assessment, AssessmentType, AIAssessment, AIAssessmentsResponse } from '@/types';

const typeConfig: Record<AssessmentType, { icon: typeof FileText; color: string; label: string }> = {
  'practice': { icon: FileText, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Practice' },
  'mock': { icon: Clock, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Mock Test' },
  'progress': { icon: TrendingUp, color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Progress' },
  'gap': { icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'Gap Analysis' },
  'class-quiz': { icon: Target, color: 'bg-primary/10 text-primary border-primary/20', label: 'Class Quiz' },
};

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  pending: { icon: Loader2, color: 'text-yellow-500', label: 'Pending' },
};

interface RetryState {
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
}

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiAssessments, setAiAssessments] = useState<AIAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AssessmentType | 'all'>('all');
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [retryState, setRetryState] = useState<RetryState | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  // Check for generated assessment from location state
  useEffect(() => {
    if (location.state?.assessment) {
      const newAssessment = location.state.assessment as Assessment;
      setAssessments(prev => {
        if (prev.find(a => a.id === newAssessment.id)) return prev;
        return [newAssessment, ...prev];
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAssessments();
  }, [isAuthenticated, navigate]);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      // Load local practice tests
      const localData = await api.getAssessments();
      setAssessments(localData);
      
      // Load AI-generated assessments from pupil-agents API (only completed ones)
      try {
        const response: AIAssessmentsResponse = await api.getTeacherAssessments(50, 0);
        // Only keep completed assessments for user view
        const completedTests = response.assessments.filter(a => a.status === 'completed');
        setAiAssessments(completedTests);
      } catch (apiErr) {
        console.error('Could not load AI assessments:', apiErr);
        // Continue without AI assessments
      }
    } catch (err) {
      console.error('Error loading assessments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = (assessmentId: string, isAI: boolean = false) => {
    // All tests now use the same AssessmentPage UI
    // Pass isAI flag through navigation state
    navigate(`/assessment/${assessmentId}`, { state: { isAI } });
  };

  const handleRetryTest = (test: any) => {
    setRetryState({
      topics: test.selectedTopics || test.topics || [],
      difficulty: test.selectedDifficulty || test.difficulty || 'mixed',
      questionCount: test.totalQuestions || 10,
    });
    setTopicDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setTopicDialogOpen(open);
    if (!open) {
      setRetryState(null);
      setHistoryKey(prev => prev + 1); // Refresh history
    }
  };

  const handleFileDialogClose = (open: boolean) => {
    setFileDialogOpen(open);
    if (!open) {
      setHistoryKey(prev => prev + 1); // Refresh history
    }
  };

  // Convert AI assessments to local format for unified display
  const aiAsAssessments: Assessment[] = aiAssessments.map(ai => ({
    id: ai.id,
    type: 'mock' as AssessmentType,
    title: ai.test_name || 'AI Generated Test',
    description: `${ai.subject || 'Subject'} - ${ai.test_type || 'Test'}`,
    topics: ai.topics || [],
    questions: [], // Will be loaded when starting
    totalQuestions: ai.number_of_questions || 0,
    status: 'available' as const,
    createdAt: new Date(ai.created_at || Date.now()),
    difficulty: ai.difficulty || 'medium',
    estimatedTime: ai.estimated_time_minutes,
  }));

  const allAssessments = [...aiAsAssessments, ...assessments];
  
  const filteredAssessments = filter === 'all' 
    ? allAssessments 
    : allAssessments.filter(a => a.type === filter);

  const filters: { value: AssessmentType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Tests' },
    { value: 'practice', label: 'Practice' },
    { value: 'mock', label: 'Mock Tests' },
    { value: 'progress', label: 'Progress' },
    { value: 'gap', label: 'Gap Analysis' },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
            <p className="text-muted-foreground mt-1">Choose a test type to begin</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFileDialogOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              From File
            </Button>
            <Button onClick={() => setTopicDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Practice Test
            </Button>
          </div>
        </div>

        {/* Create Options Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Custom Practice Test Card */}
          <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Custom Practice Test</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select topics and difficulty level for personalized practice.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Choose topics
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Select difficulty
                    </span>
                  </div>
                  <Button onClick={() => setTopicDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Material Card */}
          <Card className="bg-gradient-to-br from-green-500/10 via-teal-500/10 to-cyan-500/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Upload className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Quiz from Study Material</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload PDFs, documents, or presentations to generate a quiz.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      PDF, DOC, PPT
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI-generated
                    </span>
                  </div>
                  <Button variant="outline" onClick={() => setFileDialogOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Practice Test History */}
        <PracticeTestHistory key={historyKey} onRetry={handleRetryTest} />

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Assessment Grid - Unified display */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map(assessment => {
            const config = typeConfig[assessment.type];
            const Icon = config.icon;
            const isAI = aiAssessments.some(ai => ai.id === assessment.id);
            
            return (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={cn("mb-2", config.color)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    {assessment.status === 'scheduled' && (
                      <Badge variant="secondary">
                        <Calendar className="w-3 h-3 mr-1" />
                        Scheduled
                      </Badge>
                    )}
                    {assessment.difficulty && (
                      <Badge 
                        variant="outline" 
                        className={difficultyColors[assessment.difficulty]}
                      >
                        {assessment.difficulty}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{assessment.description}</p>
                  
                  {assessment.topics && assessment.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {assessment.topics.slice(0, 3).map(topic => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {assessment.topics.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{assessment.topics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {assessment.totalQuestions} questions
                    </span>
                    {assessment.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        ~{assessment.estimatedTime} min
                      </span>
                    )}
                  </div>

                  <Button 
                    className="w-full gap-2"
                    onClick={() => handleStartTest(assessment.id, isAI)}
                    disabled={assessment.status === 'scheduled'}
                  >
                    <Play className="w-4 h-4" />
                    {assessment.status === 'scheduled' ? 'Coming Soon' : 'Start Test'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Topic Selection Dialog */}
      <TopicSelectionDialog
        open={topicDialogOpen}
        onOpenChange={handleDialogClose}
        onStartTest={handleStartTest}
        initialTopics={retryState?.topics}
        initialDifficulty={retryState?.difficulty}
        initialQuestionCount={retryState?.questionCount}
      />

      {/* File Upload Dialog */}
      <FileUploadQuizDialog
        open={fileDialogOpen}
        onOpenChange={handleFileDialogClose}
      />
    </AppLayout>
  );
}
