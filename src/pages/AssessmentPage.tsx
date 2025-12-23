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
import type { Assessment, AssessmentAttempt, AIAssessmentDetail, Question, AssessmentSubmissionRequest, AssessmentSubmissionResponse } from '@/types';

export default function AssessmentPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, startAssessment, resetAssessment } = useAppStore();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [isAIAssessment, setIsAIAssessment] = useState(false);
  const [isClassAssessment, setIsClassAssessment] = useState(false);

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

  const convertAIToAssessment = (aiData: AIAssessmentDetail): Assessment => {
    const questions: Question[] = aiData.questions.map((q, idx) => {
      // Handle different question types
      if (q.questionType === 'Integer' || q.questionType === 'Descriptive') {
        // For Integer and Descriptive, no options
        return {
          id: q._id,
          text: q.questionText,
          type: 'short-answer' as const,
          questionType: q.questionType,
          correctAnswer: q.answer.key || '',
          explanation: q.answer.explanation || '',
          conceptId: q.topics[0] || 'general',
          conceptName: q.topics[0] || 'General',
          difficulty: q.difficulty,
          points: q.questionType === 'Descriptive' ? 5 : 3,
        };
      } else {
        // MCQ type - handle single or multiple correct answers
        const isMultipleCorrect = typeof q.answer.key === 'string' && q.answer.key.includes(',');
        let correctAnswer: number | string;
        
        if (isMultipleCorrect) {
          // Keep as string with comma-separated keys for multi-select
          correctAnswer = q.answer.key as string;
        } else {
          // Single correct answer - find the index
          const key = Array.isArray(q.answer.key) ? q.answer.key[0] : q.answer.key;
          correctAnswer = q.options.findIndex(opt => opt.key === key);
        }
        
        return {
          id: q._id,
          text: q.questionText,
          type: 'mcq' as const,
          questionType: 'MCQ',
          options: q.options.map(opt => opt.text),
          optionKeys: q.options.map(opt => opt.key), // Store original keys for submission
          correctAnswer,
          explanation: q.answer.explanation || '',
          conceptId: q.topics[0] || 'general',
          conceptName: q.topics[0] || 'General',
          difficulty: q.difficulty,
          points: isMultipleCorrect ? 4 : 2,
        };
      }
    });

    // Handle both _id and id fields from API
    const assessmentId = (aiData as any)._id || aiData.id;
    console.log('Assessment ID from API:', assessmentId);
    
    return {
      id: assessmentId,
      title: aiData.test_name || 'AI Generated Test',
      description: `${aiData.test_type || 'Practice'} test on ${aiData.topics?.join(', ') || 'various topics'}`,
      type: 'mock',
      questions,
      timeLimit: aiData.estimated_time_minutes || 30,
      totalQuestions: questions.length,
      status: 'available',
      difficulty: aiData.difficulty || 'medium',
      topics: aiData.topics || undefined,
      createdAt: aiData.created_at ? new Date(aiData.created_at) : new Date(),
    };
  };

  const loadAssessment = async () => {
    if (!assessmentId) return;
    setIsLoading(true);
    
    try {
      // Check if this is an AI assessment or class assessment from navigation state
      const isAI = location.state?.isAI || false;
      const isClass = location.state?.isClass || false;
      
      if (isClass) {
        console.log('Loading class assessment with ID:', assessmentId);
        setIsAIAssessment(true); // Treat as AI assessment for rendering
        setIsClassAssessment(true); // Mark as class assessment for submission
        const classData = await api.getClassAssessmentById(assessmentId);
        console.log('Class assessment data received:', classData);
        
        if (classData) {
          const convertedAssessment = convertAIToAssessment(classData);
          console.log('Converted class assessment:', convertedAssessment);
          setAssessment(convertedAssessment);
          startAssessment(convertedAssessment);
        } else {
          console.error('No class assessment data returned');
        }
      } else if (isAI) {
        console.log('Loading AI assessment with ID:', assessmentId);
        setIsAIAssessment(true);
        setIsClassAssessment(false);
        const aiData = await api.getAIAssessmentById(assessmentId);
        console.log('AI assessment data received:', aiData);
        
        if (aiData) {
          const convertedAssessment = convertAIToAssessment(aiData);
          console.log('Converted assessment:', convertedAssessment);
          setAssessment(convertedAssessment);
          startAssessment(convertedAssessment);
        } else {
          console.error('No AI data returned');
        }
      } else {
        setIsAIAssessment(false);
        setIsClassAssessment(false);
        const data = await api.getAssessment(assessmentId);
        if (data) { setAssessment(data); startAssessment(data); }
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      setAssessment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (answers: Record<string, number | null | number[] | string>, timeTaken: number, timings?: Record<string, number>) => {
    if (!assessment || !user) {
      console.error('Missing assessment or user:', { assessment, user });
      return;
    }
    setIsLoading(true);

    try {
      if (isClassAssessment) {
        // Submit to Backend API for class assessments
        const assessmentIdToUse = assessment.id || assessmentId;
        console.log('Using assessment ID for class assessment submission:', assessmentIdToUse);
        
        if (!assessmentIdToUse || !/^[a-f\d]{24}$/i.test(assessmentIdToUse)) {
          console.error('Invalid assessment ID format:', assessmentIdToUse);
          throw new Error('Invalid assessment ID format. Expected MongoDB ObjectId.');
        }
        
        if (!user.id) {
          console.error('Invalid student ID:', user.id);
          throw new Error('Student ID is required. Please log in again.');
        }
        
        // Get class_id from user profile
        const class_id = user.profile?.current_class_id;
        if (!class_id) {
          throw new Error('Class ID not found in user profile. Please contact support.');
        }
        
        const classSubmissionData = {
          assessment_id: assessmentIdToUse,
          student_id: user.id,
          class_id: class_id,
          total_time: timeTaken,
          submission_date: new Date().toISOString(),
          questions: Object.entries(answers).map(([questionId, answer]) => {
            const question = assessment.questions.find(q => q.id === questionId);
            let userAnswer: string;
            let correctAnswer: string | null = null;
            
            if (!question) {
              userAnswer = '';
            } else if (question.questionType === 'Integer' || question.questionType === 'Descriptive') {
              userAnswer = typeof answer === 'string' ? answer : '';
              correctAnswer = question.correctAnswer as string;
            } else if (Array.isArray(answer)) {
              // Multiple choice - convert to comma-separated keys
              userAnswer = answer
                .map(idx => question.optionKeys?.[idx])
                .filter(Boolean)
                .join(',');
              correctAnswer = Array.isArray(question.correctAnswer) 
                ? question.correctAnswer.join(',')
                : question.correctAnswer as string;
            } else if (typeof answer === 'number' && question.optionKeys) {
              // Single choice - get the key
              userAnswer = question.optionKeys[answer] || '';
              correctAnswer = typeof question.correctAnswer === 'number'
                ? question.optionKeys[question.correctAnswer]
                : question.correctAnswer as string;
            } else {
              userAnswer = '';
            }
            
            // Map questionType to expected format
            let questionType = 'multiple_choice';
            if (question?.questionType === 'Integer') {
              questionType = 'short_answer';
            } else if (question?.questionType === 'Descriptive') {
              questionType = 'long_answer';
            }
            
            // Use actual time spent on this question if available, otherwise use average
            const avgTimePerQuestion = Math.floor(timeTaken / Object.keys(answers).length);
            const questionTime = timings?.[questionId] || avgTimePerQuestion;
            
            return {
              question: question?.text || '',
              options: question?.options || [],
              questionType: questionType,
              user_answer: userAnswer,
              correct_answer: correctAnswer,
              taking_time: questionTime.toString(),
            };
          }),
        };

        console.log('Constructed class assessment submission data:', classSubmissionData);
        const response = await api.submitClassAssessment(classSubmissionData);
        console.log('Class assessment submission response:', response);
        
        // Show success message and redirect
        alert(`Assessment submitted successfully! Submission ID: ${response.submission_id}`);
        navigate('/assessments');
        return;
      } else if (isAIAssessment) {
        // Submit to the API endpoint for AI assessments
        console.log('Assessment:', assessment);
        console.log('Assessment ID:', assessment.id);
        console.log('User:', user);
        console.log('Answers:', answers);
        console.log('Time taken:', timeTaken);
        
        // Validate that we have proper MongoDB ObjectIds (24 hex characters)
        // Try to get ID from assessment or from URL params as fallback
        const assessmentIdToUse = assessment.id || assessmentId;
        
        if (!assessmentIdToUse || !/^[a-f\d]{24}$/i.test(assessmentIdToUse)) {
          console.error('Invalid assessment ID format:', assessmentIdToUse);
          console.error('Assessment object:', assessment);
          throw new Error('Invalid assessment ID format. Expected MongoDB ObjectId.');
        }
        
        if (!user.id || !/^[a-f\d]{24}$/i.test(user.id)) {
          console.error('Invalid student ID format:', user.id);
          throw new Error('Invalid student ID format. Please log in again.');
        }
        
        const submissionData: AssessmentSubmissionRequest = {
          assessment_id: assessmentIdToUse,
          student_id: user.id,
          answers: Object.entries(answers).map(([questionId, answer]) => {
            const question = assessment.questions.find(q => q.id === questionId);
            let selectedAnswer: any;
            
            if (!question) {
              selectedAnswer = '';
            } else if (question.questionType === 'Integer' || question.questionType === 'Descriptive') {
              // For Integer/Descriptive, answer is already a string - send as-is
              selectedAnswer = typeof answer === 'string' ? answer : '';
            } else if (Array.isArray(answer)) {
              // Multiple selection MCQ - convert indices to option KEYS (A, B, C, D)
              selectedAnswer = answer
                .map(idx => question.optionKeys?.[idx])
                .filter(Boolean); // Send as array of keys
            } else if (typeof answer === 'number' && question.optionKeys) {
              // Single selection MCQ - send the option KEY (A, B, C, D)
              selectedAnswer = question.optionKeys[answer] || '';
            } else {
              selectedAnswer = '';
            }
            
            return {
              question_id: questionId,
              selected_answer: selectedAnswer,
              time_taken_seconds: Math.floor(timeTaken / Object.keys(answers).length),
            };
          }),
          total_time_seconds: timeTaken,
          submitted_at: new Date().toISOString(),
        };

        console.log('Constructed submission data:', submissionData);
        console.log('Sample answers:', JSON.stringify(submissionData.answers.slice(0, 3), null, 2));
        const response: AssessmentSubmissionResponse = await api.submitAssessment(submissionData);
        
        // Convert API response to AssessmentAttempt format for consistent UI
        const attempt: AssessmentAttempt = {
          id: response.submission_id,
          assessmentId: response.assessment_id,
          assessmentType: assessment.type,
          userId: response.student_id,
          responses: Object.entries(answers).map(([questionId, answer]) => {
            const question = assessment.questions.find(q => q.id === questionId);
            const isCorrect = answer !== null && question ? answer === question.correctAnswer : false;
            // Convert answer to proper type - if it's an array, join to string
            const answerValue = Array.isArray(answer) ? answer.join(',') : (answer ?? -1);
            return {
              questionId,
              answer: answerValue,
              isCorrect,
              timeSpent: Math.floor(timeTaken / Object.keys(answers).length),
            };
          }),
          score: response.score,
          totalPoints: response.max_score,
          percentage: response.percentage,
          startedAt: new Date(Date.now() - timeTaken * 1000),
          completedAt: new Date(),
          timeSpent: response.time_taken_seconds,
          conceptBreakdown: [], // API doesn't provide this yet
          recommendations: [], // API doesn't provide this yet
        };
        
        setResult(attempt);
      } else {
        // Use local mock API for practice tests
        const responses = Object.entries(answers).map(([questionId, answer]) => {
          // Convert answer to proper type - if it's an array, join to string
          const answerValue = Array.isArray(answer) ? answer.join(',') : (answer ?? -1);
          return { 
            questionId, 
            answer: answerValue 
          };
        });
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
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false);
    }
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
              {result.conceptBreakdown && result.conceptBreakdown.length > 0 && (
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
              )}
              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {result.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex gap-3">
                {/* <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
                  <Home className="w-4 h-4 mr-2" />Dashboard
                </Button> */}
                <Button variant="outline" className="flex-1" onClick={() => navigate('/assessments')}>
                  <Home className="w-4 h-4 mr-2" />Home
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

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg space-y-2">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Security Features Enabled
                </p>
                <ul className="text-xs text-warning space-y-1">
                  <li>• Exam will run in mandatory fullscreen mode</li>
                  <li>• Tab switching, window blur, and fullscreen exit will be tracked</li>
                  <li>• Right-click, copy, paste, and shortcuts are disabled</li>
                  <li>• Maximum 3 violations allowed - test auto-submits after that</li>
                  <li>• Make sure you're ready before starting!</li>
                </ul>
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
      enableSecurity={true}
      maxViolations={3}
    />
  );
}
