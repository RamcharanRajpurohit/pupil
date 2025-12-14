import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Search,
  Clock,
  Calendar,
  Filter,
  ChevronRight,
  FileText,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssessmentType, AssessmentHistoryItem } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const typeLabels: Record<AssessmentType, string> = {
  'practice': 'Practice Test',
  'mock': 'Mock Test',
  'progress': 'Progress Test',
  'gap': 'Gap Test',
  'class-quiz': 'Class Quiz',
};

const typeColors: Record<AssessmentType, string> = {
  'practice': 'bg-blue-500',
  'mock': 'bg-purple-500',
  'progress': 'bg-green-500',
  'gap': 'bg-orange-500',
  'class-quiz': 'bg-primary',
};

const typeBadgeStyles: Record<AssessmentType, string> = {
  'practice': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'mock': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'progress': 'bg-green-500/10 text-green-600 border-green-500/20',
  'gap': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'class-quiz': 'bg-primary/10 text-primary border-primary/20',
};

export default function TestHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, progress } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<AssessmentHistoryItem | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  if (isLoading || !progress) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const assessmentHistory = progress.assessmentHistory || [];
  
  const filteredTests = assessmentHistory.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || test.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Stats
  const totalTests = assessmentHistory.length;
  const avgScore = assessmentHistory.length > 0 
    ? Math.round(assessmentHistory.reduce((sum, t) => sum + t.percentage, 0) / assessmentHistory.length)
    : 0;
  const totalTime = assessmentHistory.reduce((sum, t) => sum + t.timeSpent, 0);
  const bestScore = assessmentHistory.length > 0 
    ? Math.max(...assessmentHistory.map(t => t.percentage))
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Test History</h1>
            <p className="text-muted-foreground mt-1">Review all your past assessments</p>
          </div>
          <Button onClick={() => navigate('/assessments')}>
            Take New Test
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalTests}</p>
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bestScore}%</p>
                  <p className="text-xs text-muted-foreground">Best Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatTime(totalTime)}</p>
                  <p className="text-xs text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tests..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="practice">Practice Tests</SelectItem>
                  <SelectItem value="mock">Mock Tests</SelectItem>
                  <SelectItem value="progress">Progress Tests</SelectItem>
                  <SelectItem value="gap">Gap Tests</SelectItem>
                  <SelectItem value="class-quiz">Class Quizzes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Test List */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Assessments ({filteredTests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tests found matching your criteria
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTests.map(test => (
                      <div 
                        key={test.id} 
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors",
                          selectedTest?.id === test.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedTest(test)}
                      >
                        <div className={cn("w-2 h-12 rounded-full", typeColors[test.type])} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{test.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(test.completedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(test.timeSpent)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className={typeBadgeStyles[test.type]}>
                          {typeLabels[test.type]}
                        </Badge>
                        <div className={cn(
                          "text-xl font-bold",
                          test.percentage >= 70 ? "text-green-500" : test.percentage >= 50 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {test.percentage}%
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Details Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">Test Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTest ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedTest.title}</h3>
                      <Badge variant="outline" className={cn("mt-2", typeBadgeStyles[selectedTest.type])}>
                        {typeLabels[selectedTest.type]}
                      </Badge>
                    </div>

                    <div className="space-y-3 py-4 border-y border-border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Score</span>
                        <span className={cn(
                          "font-bold",
                          selectedTest.percentage >= 70 ? "text-green-500" : selectedTest.percentage >= 50 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {selectedTest.score}/{selectedTest.totalPoints} ({selectedTest.percentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{formatDate(selectedTest.completedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time Spent</span>
                        <span className="font-medium">{formatTime(selectedTest.timeSpent)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        View Detailed Analysis
                      </Button>
                      <Button className="w-full">
                        Retry Test
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a test to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
