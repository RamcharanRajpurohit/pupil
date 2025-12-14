import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  History, 
  RotateCcw, 
  Eye, 
  Clock, 
  Target, 
  FileText,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Assessment } from '@/types';

interface PracticeTestHistoryItem extends Assessment {
  completedAt: string | null;
  score: number | null;
  percentage?: number;
  fromFiles?: string[];
  selectedTopics?: string[];
  selectedDifficulty?: string;
}

interface PracticeTestHistoryProps {
  onRetry: (test: PracticeTestHistoryItem) => void;
}

export function PracticeTestHistory({ onRetry }: PracticeTestHistoryProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<PracticeTestHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('practiceTestHistory');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('practiceTestHistory');
    setHistory([]);
  };

  const removeItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem('practiceTestHistory', JSON.stringify(updated));
    setHistory(updated);
  };

  const handleReview = (test: PracticeTestHistoryItem) => {
    navigate(`/assessment/${test.id}/review`, { state: { assessment: test } });
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5" />
            Practice Test History
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {history.map((test) => (
              <div
                key={test.id}
                className="p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{test.title}</h4>
                      {test.completedAt ? (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "shrink-0",
                            test.percentage && test.percentage >= 70 
                              ? "text-green-600 border-green-600/30 bg-green-50" 
                              : "text-orange-600 border-orange-600/30 bg-orange-50"
                          )}
                        >
                          {test.percentage}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Incomplete</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {test.totalQuestions} questions
                      </span>
                      {test.difficulty && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {test.difficulty}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(test.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {/* Topics */}
                    {test.topics && test.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {test.topics.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {test.topics.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{test.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* From Files */}
                    {test.fromFiles && test.fromFiles.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        📄 From: {test.fromFiles.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => onRetry(test)}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </Button>
                    {test.completedAt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => handleReview(test)}
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => removeItem(test.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
