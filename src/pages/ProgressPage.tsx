import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProgressCharts } from '@/components/progress/ProgressCharts';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  ArrowRight,
  Flame,
  ChevronRight,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssessmentType } from '@/types';

const typeColors: Record<AssessmentType, string> = {
  'practice': 'bg-blue-500',
  'mock': 'bg-purple-500',
  'progress': 'bg-green-500',
  'gap': 'bg-orange-500',
  'class-quiz': 'bg-primary',
};

export default function ProgressPage() {
  const navigate = useNavigate();
  const { isAuthenticated, progress, setProgress, courses } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProgress();
  }, [isAuthenticated, navigate]);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudentProgress();
      setProgress(data);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !progress) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate trend from last 5 assessments
  const recentScores = progress.assessmentHistory?.slice(0, 5).map(h => h.percentage) || [];
  const avgRecent = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
  const olderScores = progress.assessmentHistory?.slice(5, 10).map(h => h.percentage) || [];
  const avgOlder = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : avgRecent;
  const trend = avgRecent - avgOlder;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Report</h1>
          <p className="text-muted-foreground mt-1">Track your learning journey and identify areas for improvement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{progress.overallMastery}%</p>
                  <p className="text-xs text-muted-foreground">Overall Mastery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{progress.streakDays}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatTime(progress.totalTimeSpent)}</p>
                  <p className="text-xs text-muted-foreground">Time Studied</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", trend >= 0 ? "bg-green-500/10" : "bg-red-500/10")}>
                  {trend >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{trend >= 0 ? '+' : ''}{trend.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Recent Trend</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => {
                const courseConcepts = course.concepts || [];
                const conceptMasteries = courseConcepts.map(c => progress.conceptMastery[c.id] || 0);
                const avgMastery = conceptMasteries.length > 0 
                  ? Math.round(conceptMasteries.reduce((a, b) => a + b, 0) / conceptMasteries.length)
                  : 0;
                const masteredCount = conceptMasteries.filter(m => m >= 70).length;
                
                return (
                  <div 
                    key={course.id} 
                    className="p-4 rounded-lg bg-secondary/30 space-y-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => navigate(`/progress/course/${course.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{course.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {masteredCount}/{courseConcepts.length} concepts mastered
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-lg font-bold",
                          avgMastery >= 70 ? "text-green-500" : avgMastery >= 50 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {avgMastery}%
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <Progress 
                      value={avgMastery} 
                      className={cn(
                        "h-2",
                        avgMastery >= 70 && "[&>div]:bg-green-500",
                        avgMastery >= 50 && avgMastery < 70 && "[&>div]:bg-yellow-500",
                        avgMastery < 50 && "[&>div]:bg-red-500"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Concept Mastery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Concept Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.flatMap(course => 
                  course.concepts.map(concept => {
                    const mastery = progress.conceptMastery[concept.id] || 0;
                    const status = mastery >= 70 ? 'strong' : mastery >= 50 ? 'needs-work' : 'weak';
                    return (
                      <div key={concept.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{concept.name}</span>
                            <Badge variant="outline" className="text-xs">{course.title.split(':')[0]}</Badge>
                          </div>
                          <span className={cn(
                            "text-sm font-semibold",
                            status === 'strong' && "text-green-500",
                            status === 'needs-work' && "text-yellow-500",
                            status === 'weak' && "text-red-500"
                          )}>
                            {mastery}%
                          </span>
                        </div>
                        <Progress 
                          value={mastery} 
                          className={cn(
                            "h-2",
                            status === 'strong' && "[&>div]:bg-green-500",
                            status === 'needs-work' && "[&>div]:bg-yellow-500",
                            status === 'weak' && "[&>div]:bg-red-500"
                          )}
                        />
                      </div>
                    );
                  })
                ).slice(0, 8)}
              </CardContent>
            </Card>

            {/* Assessment History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Assessments
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/test-history')}>
                  <History className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progress.assessmentHistory?.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                      <div className={cn("w-2 h-10 rounded-full", typeColors[item.type])} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.completedAt)} • {formatTime(Math.floor(item.timeSpent / 60))}</p>
                      </div>
                      <div className={cn(
                        "text-lg font-bold",
                        item.percentage >= 70 ? "text-green-500" : item.percentage >= 50 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Charts */}
            <ProgressCharts 
              assessmentHistory={progress.assessmentHistory || []} 
              conceptMastery={progress.conceptMastery}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Strong Areas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Strong Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {progress.strongAreas?.map(area => (
                    <Badge key={area} variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weak Areas */}
            <Card className="border-orange-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {progress.weakAreas?.map(area => (
                    <Badge key={area} variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {area}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full" onClick={() => navigate('/assessments')}>
                  Take Gap Test <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Gap Topics Detail */}
            {progress.gapTopics && progress.gapTopics.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Gap Analysis Detail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {progress.gapTopics.map(gap => (
                    <div key={gap.conceptId} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{gap.topic}</span>
                        <span className="text-sm text-red-500 font-semibold">{gap.accuracy}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {gap.questionsAttempted} questions attempted
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
