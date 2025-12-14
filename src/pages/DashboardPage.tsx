import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { ScheduleCard } from '@/components/dashboard/ScheduleCard';
import { ProgressCard } from '@/components/dashboard/ProgressCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  FileText, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Play,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assessment, AssessmentType } from '@/types';

const typeConfig: Record<AssessmentType, { icon: typeof FileText; color: string; label: string }> = {
  'practice': { icon: FileText, color: 'text-blue-500', label: 'Practice' },
  'mock': { icon: Clock, color: 'text-purple-500', label: 'Mock' },
  'progress': { icon: TrendingUp, color: 'text-green-500', label: 'Progress' },
  'gap': { icon: AlertTriangle, color: 'text-orange-500', label: 'Gap' },
  'class-quiz': { icon: Target, color: 'text-primary', label: 'Quiz' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setCourses, setSchedule, setProgress, courses, schedule, progress } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [coursesData, scheduleData, progressData, assessmentsData] = await Promise.all([
          api.getCourses(),
          api.getSchedule(),
          api.getStudentProgress(),
          api.getAssessments(),
        ]);
        setCourses(coursesData);
        setSchedule(scheduleData);
        setProgress(progressData);
        setAssessments(assessmentsData.filter(a => a.status === 'available').slice(0, 3));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate, setCourses, setSchedule, setProgress]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-pulse-soft">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const todaysClasses = schedule.filter(c => {
    const classDate = new Date(c.startTime);
    const today = new Date();
    return classDate.toDateString() === today.toDateString();
  });

  const completedClassWithQuiz = schedule.find(c => c.status === 'completed' && c.quizAvailable);
  const gapTests = assessments.filter(a => a.type === 'gap');

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <Sparkles className="w-6 h-6 text-accent animate-bounce-soft" />
          </div>
          <p className="text-muted-foreground">
            {progress?.streakDays ? `🔥 ${progress.streakDays} day streak! ` : ''}
            Continue your learning journey today.
          </p>
        </div>

        {/* Quick Action: Pending Quiz */}
        {completedClassWithQuiz && (
          <Card className="border-primary/30 bg-primary/5 animate-fade-up">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Class Quiz Available</p>
                  <p className="text-sm text-muted-foreground">{completedClassWithQuiz.title}</p>
                </div>
              </div>
              <Button onClick={() => navigate(`/quiz/${completedClassWithQuiz.id}`)}>
                Take Quiz <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Gap Tests Alert */}
        {gapTests.length > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5 animate-fade-up stagger-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Gap Analysis Available</p>
                  <p className="text-sm text-muted-foreground">
                    {gapTests.length} targeted test{gapTests.length > 1 ? 's' : ''} for your weak areas
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/assessments')}>
                View Tests
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available Tests */}
            <div className="animate-fade-up stagger-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Available Tests</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/assessments')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assessments.map(assessment => {
                  const config = typeConfig[assessment.type];
                  const Icon = config.icon;
                  return (
                    <Card 
                      key={assessment.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/assessment/${assessment.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg bg-secondary flex items-center justify-center", config.color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge variant="secondary" className="text-xs mb-1">{config.label}</Badge>
                            <p className="font-medium text-sm text-foreground truncate">{assessment.title}</p>
                            <p className="text-xs text-muted-foreground">{assessment.totalQuestions} questions</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Courses */}
            <div className="animate-fade-up stagger-3">
              <h2 className="text-xl font-bold text-foreground mb-4">Your Courses</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map((course, index) => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                    onClick={() => navigate(`/course/${course.id}`)}
                  />
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="animate-fade-up stagger-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Today's Schedule</h2>
              {todaysClasses.length > 0 ? (
                <div className="space-y-3">
                  {todaysClasses.map((classItem) => (
                    <ScheduleCard 
                      key={classItem.id} 
                      classItem={classItem}
                      onClick={() => navigate(`/class/${classItem.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-secondary/50 rounded-xl p-6 text-center">
                  <p className="text-muted-foreground">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Progress */}
          <div className="space-y-6 animate-fade-up stagger-5">
            <ProgressCard progress={progress} courses={courses} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
