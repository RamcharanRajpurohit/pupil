import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ScheduledClass } from '@/types';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';

interface QuickActionsProps {
  pendingQuizClass?: ScheduledClass;
  onTakeQuiz?: () => void;
}

export function QuickActions({ pendingQuizClass, onTakeQuiz }: QuickActionsProps) {
  if (!pendingQuizClass) return null;

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Quiz Available!</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your quiz for <span className="font-medium text-foreground">{pendingQuizClass.title}</span> is ready
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>~15 min • 5 questions</span>
              </div>
            </div>
          </div>
          <Button onClick={onTakeQuiz} size="lg" className="w-full sm:w-auto gap-2">
            Take Quiz Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
