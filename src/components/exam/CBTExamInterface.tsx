import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, X, Save, CheckCircle, 
  AlertTriangle, Menu, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';

export type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';

interface CBTExamProps {
  title: string;
  questions: Question[];
  timeLimit: number; // in minutes
  onSubmit: (answers: Record<string, number | null>, timeTaken: number) => void;
  onExit: () => void;
  showInstantFeedback?: boolean;
}

interface QuestionState {
  selectedAnswer: number | null;
  status: QuestionStatus;
  isCorrect?: boolean;
}

export function CBTExamInterface({ 
  title, 
  questions, 
  timeLimit, 
  onSubmit, 
  onExit,
  showInstantFeedback = false 
}: CBTExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>(() => {
    const initial: Record<string, QuestionState> = {};
    questions.forEach((q, i) => {
      initial[q.id] = { 
        selectedAnswer: null, 
        status: i === 0 ? 'not-answered' : 'not-visited' 
      };
    });
    return initial;
  });
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [showPalette, setShowPalette] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 60) return 'text-red-600 bg-red-100 animate-pulse';
    if (timeRemaining <= 300) return 'text-red-600 bg-red-50';
    if (timeRemaining <= 600) return 'text-orange-600 bg-orange-50';
    return 'text-foreground bg-secondary';
  };

  const currentQuestion = questions[currentIndex];
  const currentState = questionStates[currentQuestion.id];

  const handleSelectAnswer = (answerIndex: number) => {
    if (showFeedback) return;
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedAnswer: answerIndex,
        status: prev[currentQuestion.id].status === 'marked' ? 'answered-marked' : 'answered'
      }
    }));
  };

  const handleClearResponse = () => {
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedAnswer: null,
        status: prev[currentQuestion.id].status === 'answered-marked' ? 'marked' : 'not-answered'
      }
    }));
    setShowFeedback(false);
  };

  const handleMarkForReview = () => {
    setQuestionStates(prev => {
      const current = prev[currentQuestion.id];
      const hasAnswer = current.selectedAnswer !== null;
      let newStatus: QuestionStatus;
      
      if (current.status === 'marked' || current.status === 'answered-marked') {
        newStatus = hasAnswer ? 'answered' : 'not-answered';
      } else {
        newStatus = hasAnswer ? 'answered-marked' : 'marked';
      }
      
      return {
        ...prev,
        [currentQuestion.id]: { ...current, status: newStatus }
      };
    });
  };

  const navigateToQuestion = (index: number) => {
    setShowFeedback(false);
    setCurrentIndex(index);
    setQuestionStates(prev => {
      const targetQuestion = questions[index];
      if (prev[targetQuestion.id].status === 'not-visited') {
        return {
          ...prev,
          [targetQuestion.id]: { ...prev[targetQuestion.id], status: 'not-answered' }
        };
      }
      return prev;
    });
  };

  const handleSaveAndNext = () => {
    if (showInstantFeedback && currentState.selectedAnswer !== null && !showFeedback) {
      const isCorrect = currentState.selectedAnswer === currentQuestion.correctAnswer;
      setQuestionStates(prev => ({
        ...prev,
        [currentQuestion.id]: { ...prev[currentQuestion.id], isCorrect }
      }));
      setShowFeedback(true);
      return;
    }
    
    setShowFeedback(false);
    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  const handleFinalSubmit = () => {
    const answers: Record<string, number | null> = {};
    questions.forEach(q => {
      answers[q.id] = questionStates[q.id].selectedAnswer;
    });
    const timeTaken = timeLimit * 60 - timeRemaining;
    onSubmit(answers, timeTaken);
  };

  // Question palette stats
  const stats = {
    answered: Object.values(questionStates).filter(s => s.status === 'answered' || s.status === 'answered-marked').length,
    notAnswered: Object.values(questionStates).filter(s => s.status === 'not-answered').length,
    marked: Object.values(questionStates).filter(s => s.status === 'marked' || s.status === 'answered-marked').length,
    notVisited: Object.values(questionStates).filter(s => s.status === 'not-visited').length,
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'not-visited': return 'bg-secondary text-muted-foreground border-border';
      case 'not-answered': return 'bg-red-500 text-white border-red-600';
      case 'answered': return 'bg-green-500 text-white border-green-600';
      case 'marked': return 'bg-purple-500 text-white border-purple-600';
      case 'answered-marked': return 'bg-purple-500 text-white border-purple-600 ring-2 ring-green-400';
    }
  };

  const getStatusIcon = (status: QuestionStatus) => {
    if (status === 'answered-marked') {
      return <CheckCircle className="w-3 h-3 absolute -bottom-1 -right-1 text-green-400" />;
    }
    if (status === 'marked') {
      return <Flag className="w-3 h-3" />;
    }
    return null;
  };

  // Submit confirmation modal
  if (showSubmitConfirm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Submit Exam?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Answered: {stats.answered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Not Answered: {stats.notAnswered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span>Marked: {stats.marked}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-secondary"></div>
                <span>Not Visited: {stats.notVisited}</span>
              </div>
            </div>
            
            {stats.notAnswered + stats.notVisited > 0 && (
              <p className="text-sm text-warning">
                You have {stats.notAnswered + stats.notVisited} unanswered questions!
              </p>
            )}
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitConfirm(false)}>
                Review
              </Button>
              <Button className="flex-1" onClick={handleFinalSubmit}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onExit}>
              <X className="w-4 h-4 mr-1" />
              Exit
            </Button>
            <span className="text-sm font-medium hidden sm:inline">{title}</span>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors",
            getTimerColor()
          )}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setShowPalette(!showPalette)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">Question {currentIndex + 1}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  currentQuestion.difficulty === 'easy' && "bg-success/10 text-success",
                  currentQuestion.difficulty === 'medium' && "bg-warning/10 text-warning",
                  currentQuestion.difficulty === 'hard' && "bg-error/10 text-error",
                )}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentQuestion.conceptName}</span>
                <span className="font-medium">+{currentQuestion.points} pts</span>
              </div>
            </div>

            {/* Question Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-lg leading-relaxed">{currentQuestion.text}</p>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options?.map((option, idx) => {
                const isSelected = currentState.selectedAnswer === idx;
                const isCorrect = idx === currentQuestion.correctAnswer;
                const showCorrectness = showFeedback && showInstantFeedback;
                
                let buttonClass = "w-full h-auto py-4 px-5 justify-start text-left border-2 transition-all";
                
                if (showCorrectness) {
                  if (isCorrect) {
                    buttonClass += " border-green-500 bg-green-50 dark:bg-green-500/10";
                  } else if (isSelected && !isCorrect) {
                    buttonClass += " border-red-500 bg-red-50 dark:bg-red-500/10";
                  } else {
                    buttonClass += " border-border";
                  }
                } else if (isSelected) {
                  buttonClass += " border-primary bg-primary/5";
                } else {
                  buttonClass += " border-border hover:border-primary/50";
                }

                return (
                  <button
                    key={idx}
                    className={cn(buttonClass, "rounded-lg flex items-center")}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={showFeedback}
                  >
                    <span className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 transition-colors",
                      showCorrectness && isCorrect && "bg-green-500 text-white",
                      showCorrectness && isSelected && !isCorrect && "bg-red-500 text-white",
                      !showCorrectness && isSelected && "bg-primary text-primary-foreground",
                      !showCorrectness && !isSelected && "bg-secondary text-foreground"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-foreground">{option}</span>
                    {showCorrectness && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                    )}
                    {showCorrectness && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && showInstantFeedback && (
              <Card className={cn(
                "mb-6",
                currentState.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    {currentState.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={cn(
                        "font-semibold mb-1",
                        currentState.isCorrect ? "text-green-600" : "text-red-600"
                      )}>
                        {currentState.isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleMarkForReview}
                className={cn(
                  currentState.status === 'marked' || currentState.status === 'answered-marked'
                    ? "border-purple-500 text-purple-600"
                    : ""
                )}
              >
                <Flag className="w-4 h-4 mr-2" />
                {currentState.status === 'marked' || currentState.status === 'answered-marked' 
                  ? 'Unmark' 
                  : 'Mark for Review'}
              </Button>
              
              <Button variant="outline" onClick={handleClearResponse}>
                Clear Response
              </Button>
              
              <div className="flex-1" />
              
              <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <Button onClick={handleSaveAndNext}>
                <Save className="w-4 h-4 mr-2" />
                {showInstantFeedback && currentState.selectedAnswer !== null && !showFeedback 
                  ? 'Check Answer' 
                  : currentIndex === questions.length - 1 
                    ? 'Save' 
                    : 'Save & Next'}
              </Button>
              
              <Button variant="outline" onClick={handleNext} disabled={currentIndex === questions.length - 1}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </main>

        {/* Question Palette Sidebar */}
        <aside className={cn(
          "w-72 bg-card border-l border-border flex flex-col transition-all duration-300 max-h-[calc(100vh-3.5rem)]",
          "fixed lg:relative right-0 top-14 z-40",
          showPalette ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:w-0 lg:border-0"
        )}>
          <div className="p-4 border-b border-border flex-shrink-0">
            <h3 className="font-semibold mb-3">Question Palette</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Answered ({stats.answered})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Not Answered ({stats.notAnswered})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span>Marked ({stats.marked})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-secondary"></div>
                <span>Not Visited ({stats.notVisited})</span>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const state = questionStates[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(idx)}
                    className={cn(
                      "relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium border transition-all hover:scale-105",
                      getStatusColor(state.status),
                      currentIndex === idx && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {idx + 1}
                    {getStatusIcon(state.status)}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border flex-shrink-0 bg-card">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setShowSubmitConfirm(true)}
            >
              Submit Test
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
