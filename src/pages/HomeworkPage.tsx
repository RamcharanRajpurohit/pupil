import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Clock, 
  BookOpen, 
  Brain, 
  Sparkles,
  ChevronRight,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HomeworkPage() {
  const navigate = useNavigate();
  const { isAuthenticated, homeworkDecks, setHomeworkDecks, setActiveHomework, toggleChat } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadHomework = async () => {
      setIsLoading(true);
      try {
        const decks = await api.getHomeworkDecks();
        setHomeworkDecks(decks);
      } catch (error) {
        console.error('Failed to load homework:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomework();
  }, [isAuthenticated, navigate, setHomeworkDecks]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-pulse-soft">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your homework...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'current-mistakes':
        return Target;
      case 'past-mistakes':
        return Brain;
      case 'new-concepts':
        return Sparkles;
      default:
        return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'current-mistakes':
        return 'text-error bg-error/10';
      case 'past-mistakes':
        return 'text-warning bg-warning/10';
      case 'new-concepts':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Homework</h1>
          <p className="text-muted-foreground">
            Personalized practice sets based on your class performance
          </p>
        </div>

        {/* Homework Decks */}
        <div className="space-y-4">
          {homeworkDecks.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No homework yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete a quiz to get your personalized homework deck
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </Card>
          ) : (
            homeworkDecks.map((deck, index) => {
              const currentMistakes = deck.questions.filter(q => q.category === 'current-mistakes').length;
              const pastMistakes = deck.questions.filter(q => q.category === 'past-mistakes').length;
              const newConcepts = deck.questions.filter(q => q.category === 'new-concepts').length;
              
              return (
                <Card 
                  key={deck.id} 
                  variant="interactive"
                  className={`animate-fade-up stagger-${index + 1}`}
                  onClick={() => {
                    setActiveHomework(deck);
                    toggleChat();
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {deck.questions.length} problems
                          </Badge>
                          <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
                            <Clock className="w-3 h-3" />
                            Due {format(new Date(deck.dueAt), 'MMM d')}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{deck.title}</h3>
                        <p className="text-sm text-muted-foreground">{deck.description}</p>
                      </div>

                      {/* Progress */}
                      <div className="lg:w-48 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{deck.progress}%</span>
                        </div>
                        <Progress value={deck.progress} className="h-2" />
                      </div>

                      {/* Categories Breakdown */}
                      <div className="flex items-center gap-3 lg:border-l lg:border-border lg:pl-6">
                        <div className="flex -space-x-1">
                          {[
                            { count: currentMistakes, category: 'current-mistakes', label: 'Current' },
                            { count: pastMistakes, category: 'past-mistakes', label: 'Past' },
                            { count: newConcepts, category: 'new-concepts', label: 'New' },
                          ].map((item) => {
                            const Icon = getCategoryIcon(item.category);
                            return (
                              <div
                                key={item.category}
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center border-2 border-card",
                                  getCategoryColor(item.category)
                                )}
                                title={`${item.count} ${item.label} problems`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                            );
                          })}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Category Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", "bg-error")} />
                        <span className="text-muted-foreground">Current mistakes ({currentMistakes})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", "bg-warning")} />
                        <span className="text-muted-foreground">Past mistakes ({pastMistakes})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", "bg-primary")} />
                        <span className="text-muted-foreground">New concepts ({newConcepts})</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* AI Help Prompt */}
        {homeworkDecks.length > 0 && (
          <Card className="border-primary/20 bg-primary/5 animate-fade-up stagger-3">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Need help with homework?</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI tutor can guide you through problems without giving direct answers
                </p>
              </div>
              <Button onClick={toggleChat} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Get Help
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
