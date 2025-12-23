import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar,
  Loader2,
  Play,
  Upload as UploadIcon,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function UploadedAssessmentsList() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [uploads, setUploads] = useState<UploadedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUploadedAssessments();
    }

    // Listen for refresh events from FileUploadQuizDialog
    const handleRefresh = () => {
      if (user?.id) {
        loadUploadedAssessments();
      }
    };

    window.addEventListener('refreshAssessments', handleRefresh);
    return () => window.removeEventListener('refreshAssessments', handleRefresh);
  }, [user?.id]);

  const loadUploadedAssessments = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await api.getUploadedQuestions(user.id);
      setUploads(response.uploads || []);
    } catch (error) {
      console.error('Error loading uploaded assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAssessment = async (upload: UploadedAssessment) => {
    navigate(`/uploaded-assessment/${upload._id}`, { 
      state: { upload } 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UploadIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Uploaded Assessments</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Upload a PDF containing questions to automatically extract them and create practice assessments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Uploaded Assessments</h3>
        <Badge variant="secondary">{uploads.length} upload{uploads.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {uploads.map((upload) => (
          <Card key={upload._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{upload.filename}</span>
                  </CardTitle>
                </div>
                <Badge 
                  variant="outline" 
                  className="shrink-0 bg-green-500/10 text-green-600 border-green-500/20"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Extracted
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{upload.total_questions} questions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(upload.upload_date).toLocaleDateString()}</span>
                </div>
              </div>

              {upload.question_types && Object.keys(upload.question_types).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(upload.question_types).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              )}

              <Button 
                className="w-full gap-2" 
                onClick={() => handleStartAssessment(upload)}
              >
                <Play className="w-4 h-4" />
                Attempt Assessment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
