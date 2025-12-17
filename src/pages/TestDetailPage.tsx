import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import type { AIAssessmentDetail, AIQuestion } from '@/types';
import { 
  FileText, 
  Clock, 
  Target, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function TestDetailPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<AIAssessmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: AIAssessmentDetail = await api.getAIAssessmentById(assessmentId!);
      setAssessment(data);
    } catch (err) {
      setError('Failed to load assessment details. Please try again later.');
      console.error('Error loading assessment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleMultipleAnswerChange = (questionId: string, optionKey: string, isChecked: boolean) => {
    const currentAnswers = answers[questionId]?.split(',').filter(Boolean) || [];
    let newAnswers: string[];
    
    if (isChecked) {
      newAnswers = [...currentAnswers, optionKey];
    } else {
      newAnswers = currentAnswers.filter(key => key !== optionKey);
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswers.join(',')
    }));
  };

  const toggleExplanation = (questionId: string) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const currentQuestion = assessment?.questions[currentQuestionIndex];
  const totalQuestions = assessment?.questions.length || 0;
  const isMultipleCorrect = Array.isArray(currentQuestion?.answer?.key);

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    // In a real implementation, you would submit the answers to the backend
    alert('Test submitted! (This is a demo - answers are not actually submitted)');
    navigate('/tests');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading test...</span>
        </div>
      </AppLayout>
    );
  }

  if (error || !assessment) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <p>{error || 'Assessment not found'}</p>
              </div>
              <Button onClick={() => navigate('/tests')}>
                Back to Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!testStarted) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/tests')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Tests
                </Button>
                {assessment.difficulty && (
                  <Badge 
                    variant="outline" 
                    className={difficultyColors[assessment.difficulty]}
                  >
                    {assessment.difficulty}
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-2xl mb-2">
                {assessment.test_name || 'AI-Generated Test'}
              </CardTitle>
              
              {assessment.subject && (
                <CardDescription className="flex items-center gap-1 text-lg">
                  <BookOpen className="h-5 w-5" />
                  {assessment.subject}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{assessment.number_of_questions}</p>
                    <p className="text-sm text-muted-foreground">Questions</p>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{assessment.estimated_time_minutes}</p>
                    <p className="text-sm text-muted-foreground">Minutes</p>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{assessment.total_marks}</p>
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{assessment.test_type || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Test Type</p>
                  </div>
                </div>

                {assessment.topics && assessment.topics.length > 0 && (
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-semibold mb-2">Topics Covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {assessment.topics.map((topic, idx) => (
                        <Badge key={idx} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Instructions</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Read each question carefully before answering</li>
                      <li>You can navigate between questions using the navigation buttons</li>
                      <li>Your answers are saved automatically</li>
                      <li>Submit the test when you're done</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleStartTest}
              >
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{assessment.test_name}</h1>
                <p className="text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
              <div className="flex gap-2">
                {assessment.estimated_time_minutes && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {assessment.estimated_time_minutes} min
                  </Badge>
                )}
                {assessment.total_marks && (
                  <Badge variant="outline">
                    {assessment.total_marks} marks
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className={difficultyColors[currentQuestion.difficulty]}>
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="secondary">
                  {currentQuestion.questionType}
                </Badge>
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.questionText}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* MCQ Options */}
                {currentQuestion.questionType === 'MCQ' && currentQuestion.options && (
                  <div className="space-y-3">
                    {isMultipleCorrect ? (
                      // Multiple correct answers
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          Select all correct answers:
                        </p>
                        {currentQuestion.options.map((option) => {
                          const selectedAnswers = answers[currentQuestion._id]?.split(',').filter(Boolean) || [];
                          const isChecked = selectedAnswers.includes(option.key);
                          
                          return (
                            <div key={option.key} className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                id={`${currentQuestion._id}-${option.key}`}
                                checked={isChecked}
                                onChange={(e) => handleMultipleAnswerChange(
                                  currentQuestion._id, 
                                  option.key, 
                                  e.target.checked
                                )}
                                className="mt-1 h-4 w-4 rounded border-gray-300"
                              />
                              <Label 
                                htmlFor={`${currentQuestion._id}-${option.key}`}
                                className="flex-1 cursor-pointer"
                              >
                                {option.text}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Single correct answer
                      <RadioGroup
                        value={answers[currentQuestion._id] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestion._id, value)}
                      >
                        {currentQuestion.options.map((option) => (
                          <div key={option.key} className="flex items-start space-x-3">
                            <RadioGroupItem 
                              value={option.key} 
                              id={`${currentQuestion._id}-${option.key}`}
                              className="mt-1"
                            />
                            <Label 
                              htmlFor={`${currentQuestion._id}-${option.key}`}
                              className="flex-1 cursor-pointer"
                            >
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                )}

                {/* Integer Type */}
                {currentQuestion.questionType === 'Integer' && (
                  <div>
                    <Label htmlFor={`answer-${currentQuestion._id}`}>
                      Enter your answer:
                    </Label>
                    <Input
                      id={`answer-${currentQuestion._id}`}
                      type="number"
                      placeholder="Enter your answer"
                      value={answers[currentQuestion._id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Descriptive Type */}
                {currentQuestion.questionType === 'Descriptive' && (
                  <div>
                    <Label htmlFor={`answer-${currentQuestion._id}`}>
                      Your answer:
                    </Label>
                    <Textarea
                      id={`answer-${currentQuestion._id}`}
                      placeholder="Write your answer here..."
                      value={answers[currentQuestion._id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      className="mt-2 min-h-[150px]"
                    />
                  </div>
                )}

                {/* Show Explanation Button */}
                <Button
                  variant="outline"
                  onClick={() => toggleExplanation(currentQuestion._id)}
                  className="w-full mt-4"
                >
                  {showExplanation[currentQuestion._id] ? 'Hide' : 'Show'} Explanation
                </Button>

                {/* Explanation */}
                {showExplanation[currentQuestion._id] && (
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Explanation</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-2">
                        <strong>Correct Answer:</strong>{' '}
                        {Array.isArray(currentQuestion.answer.key)
                          ? currentQuestion.answer.key.join(', ')
                          : currentQuestion.answer.key}
                      </p>
                      <p>{currentQuestion.answer.explanation}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestionIndex(i)}
                className={cn(
                  "w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  i === currentQuestionIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[assessment.questions[i]._id]
                    ? "bg-green-500 text-white"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button onClick={handleSubmitTest}>
              Submit Test
            </Button>
          ) : (
            <Button onClick={goToNextQuestion}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
