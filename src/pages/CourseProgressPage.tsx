import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  ArrowLeft,
  BarChart3,
  Target,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CourseProgressPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, progress, courses } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  const course = courses.find(c => c.id === courseId);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Simulate loading
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

  if (!course) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Course not found</p>
          <Button onClick={() => navigate('/progress')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Progress
          </Button>
        </div>
      </AppLayout>
    );
  }

  const courseConcepts = course.concepts || [];
  const conceptMasteries = courseConcepts.map(c => progress.conceptMastery[c.id] || 0);
  const avgMastery = conceptMasteries.length > 0 
    ? Math.round(conceptMasteries.reduce((a, b) => a + b, 0) / conceptMasteries.length)
    : 0;
  const masteredCount = conceptMasteries.filter(m => m >= 70).length;
  const needsWorkCount = conceptMasteries.filter(m => m >= 50 && m < 70).length;
  const weakCount = conceptMasteries.filter(m => m < 50).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/progress')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground">Detailed concept mastery breakdown</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className={cn(
                    "text-2xl font-bold",
                    avgMastery >= 70 ? "text-green-500" : avgMastery >= 50 ? "text-yellow-500" : "text-red-500"
                  )}>{avgMastery}%</p>
                  <p className="text-xs text-muted-foreground">Overall Mastery</p>
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
                  <p className="text-2xl font-bold text-green-500">{masteredCount}</p>
                  <p className="text-xs text-muted-foreground">Mastered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{needsWorkCount}</p>
                  <p className="text-xs text-muted-foreground">Needs Work</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{weakCount}</p>
                  <p className="text-xs text-muted-foreground">Weak Areas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Concept List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              All Concepts ({courseConcepts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseConcepts.map(concept => {
              const mastery = progress.conceptMastery[concept.id] || 0;
              const status = mastery >= 70 ? 'strong' : mastery >= 50 ? 'needs-work' : 'weak';
              return (
                <div key={concept.id} className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{concept.name}</span>
                    <Badge className={cn(
                      status === 'strong' && "bg-green-500/10 text-green-600 border-green-500/20",
                      status === 'needs-work' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                      status === 'weak' && "bg-red-500/10 text-red-600 border-red-500/20"
                    )} variant="outline">
                      {mastery}% mastery
                    </Badge>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {status === 'strong' ? 'Great progress! Keep it up.' : 
                     status === 'needs-work' ? 'Making progress. Practice more to improve.' : 
                     'Needs attention. Focus on this concept.'}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
