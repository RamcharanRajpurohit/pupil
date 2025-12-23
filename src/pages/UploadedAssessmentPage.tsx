import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CBTExamInterface } from '@/components/exam/CBTExamInterface';
import { 
  Loader2, Home, ArrowLeft, FileText, Clock
} from 'lucide-react';
import type { Assessment, Question } from '@/types';

interface UploadedQuestion {
  questionNumber: number;
  questionType: string;
  questionText: string;
  options?: Record<string, string>;
  marks?: number | null;
  subparts?: any[];
  hasDiagram?: boolean;
  subject?: string | null;
  pageNumber?: number;
}

interface UploadedAssessment {
  _id: string;
  student_id: string;
  filename: string;
  upload_date: string;
  total_questions: number;
  pages_processed: number;
  duplicates_removed?: number;
  question_types?: Record<string, number>;
  questions: UploadedQuestion[];
}

export default function UploadedAssessmentPage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppStore();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Check if upload was passed via location state
    if (location.state?.upload) {
      const uploadData = location.state.upload as UploadedAssessment;
      const converted = convertUploadToAssessment(uploadData);
      setAssessment(converted);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
  }, [uploadId, isAuthenticated, location.state]);

  const convertUploadToAssessment = (upload: UploadedAssessment): Assessment => {
    const questions: Question[] = upload.questions
      .map((q, idx) => {
        // Determine question type and structure
        if (q.questionType === 'MCQ' && q.options && typeof q.options === 'object') {
          // Convert options object to array, filtering out null/undefined/empty values
          const optionsArray = Object.values(q.options)
            .filter(opt => opt !== null && opt !== undefined && opt !== '' && typeof opt !== 'object')
            .map(opt => String(opt).trim()); // Ensure all options are strings and trimmed
          
          // Only treat as MCQ if we have at least 2 options
          if (optionsArray.length >= 2) {
            return {
              id: `q-${upload._id}-${idx}`,
              text: q.questionText,
              type: 'mcq' as const,
              questionType: 'MCQ' as const,
              options: optionsArray,
              correctAnswer: 0, // Default to first option since we don't have correct answer
              explanation: '',
              conceptId: 'uploaded',
              conceptName: q.subject || 'Uploaded Questions',
              difficulty: 'medium' as const,
              points: q.marks || 2,
            };
          }
        }
        
        // For all other question types (Numerical Problem, Short Answer, Diagram Based, etc.)
        // or MCQs with insufficient options
        const questionType = (q.questionType === 'Numerical Problem') ? 'Integer' : 'Descriptive';
          
        return {
          id: `q-${upload._id}-${idx}`,
          text: q.questionText,
          type: 'short-answer' as const,
          questionType: questionType as 'Integer' | 'Descriptive',
          correctAnswer: '',
          explanation: '',
          conceptId: 'uploaded',
          conceptName: q.subject || 'Uploaded Questions',
          difficulty: 'medium' as const,
          points: q.marks || 3,
        };
      })
      .filter(q => q !== null && q !== undefined); // Filter out any null questions

    return {
      id: upload._id,
      title: upload.filename.replace('.pdf', ''),
      description: `Assessment from uploaded PDF - ${upload.pages_processed} pages processed`,
      type: 'practice',
      questions,
      timeLimit: questions.length * 2, // 2 minutes per question
      totalQuestions: questions.length,
      status: 'available',
      difficulty: 'medium',
      createdAt: new Date(upload.upload_date),
    };
  };

  const handleSubmit = async (answers: Record<string, number | null | number[] | string>, timeTaken: number) => {
    if (!assessment || !user) {
      console.error('Missing assessment or user');
      return;
    }

    // For uploaded assessments, we'll just calculate a basic score
    // since we don't have full answer validation
    let correctCount = 0;
    let totalQuestions = assessment.questions.length;

    assessment.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (q.type === 'mcq' && typeof userAnswer === 'number') {
        if (userAnswer === q.correctAnswer) {
          correctCount++;
        }
      }
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Navigate to a simple results page
    navigate('/assessments', {
      state: {
        completedAssessment: {
          title: assessment.title,
          score: Math.round(score),
          totalQuestions,
          correctCount,
          timeTaken
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The uploaded assessment could not be loaded.
            </p>
            <Button onClick={() => navigate('/assessments')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{assessment.title}</CardTitle>
                <p className="text-muted-foreground">{assessment.description}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                <FileText className="w-3 h-3 mr-1" />
                Uploaded
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{assessment.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{assessment.timeLimit}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Instructions
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Answer all questions to the best of your ability</li>
                <li>You can navigate between questions freely</li>
                <li>Your progress is saved automatically</li>
                <li>Submit when you're ready or when time runs out</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/assessments')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setExamStarted(true)}
                className="flex-1"
              >
                Start Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CBTExamInterface
      title={assessment.title}
      questions={assessment.questions}
      timeLimit={assessment.timeLimit || 60}
      onSubmit={handleSubmit}
      onExit={() => navigate('/assessments')}
      enableSecurity={false}
    />
  );
}
