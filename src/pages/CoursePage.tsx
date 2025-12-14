import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Course, ScheduledClass } from '@/types';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  Clock, 
  FileText, 
  Loader2, 
  Play, 
  Target,
  TrendingUp,
  User
} from 'lucide-react';
import { format } from 'date-fns';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadCourseData = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      try {
        const [courseData, classesData] = await Promise.all([
          api.getCourse(courseId),
          api.getClassesByCourse(courseId),
        ]);
        setCourse(courseData);
        setClasses(classesData);
      } catch (error) {
        console.error('Failed to load course data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-pulse-soft">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Course not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const completedClasses = classes.filter(c => c.status === 'completed');
  const upcomingClasses = classes.filter(c => c.status === 'upcoming' || c.status === 'live');
  const classesWithQuiz = classes.filter(c => c.quizAvailable);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Back Button & Header */}
        <div className="animate-fade-up">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start gap-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${course.color}20` }}
            >
              <BookOpen className="w-8 h-8" style={{ color: course.color }} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {course.instructor}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {course.completedClasses}/{course.totalClasses} classes
                </span>
              </div>
              <p className="text-muted-foreground">{course.description}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="animate-fade-up stagger-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground">Course Progress</span>
              <span className="text-2xl font-bold" style={{ color: course.color }}>
                {course.progress}%
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${course.progress}%`, background: course.color }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
              <span>{completedClasses.length} classes completed</span>
              <span>{upcomingClasses.length} classes remaining</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Classes & Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Quizzes Alert */}
            {classesWithQuiz.length > 0 && (
              <Card className="animate-fade-up stagger-2 border-accent/50 bg-accent/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {classesWithQuiz.length} Quiz{classesWithQuiz.length > 1 ? 'zes' : ''} Available
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Complete your quizzes to unlock homework
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate(`/quiz/${classesWithQuiz[0].id}`)}
                      className="bg-accent hover:bg-accent/90"
                    >
                      Take Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Classes */}
            <div className="animate-fade-up stagger-3">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Completed Classes
              </h2>
              {completedClasses.length > 0 ? (
                <div className="space-y-3">
                  {completedClasses.map((classItem, index) => (
                    <ClassListItem 
                      key={classItem.id}
                      classItem={classItem}
                      courseColor={course.color}
                      index={index}
                      onClick={() => navigate(`/class/${classItem.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No classes completed yet
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Upcoming Classes */}
            <div className="animate-fade-up stagger-4">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Classes
              </h2>
              {upcomingClasses.length > 0 ? (
                <div className="space-y-3">
                  {upcomingClasses.map((classItem, index) => (
                    <ClassListItem 
                      key={classItem.id}
                      classItem={classItem}
                      courseColor={course.color}
                      index={index}
                      onClick={() => navigate(`/class/${classItem.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No upcoming classes scheduled
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Concept Mastery */}
          <div className="space-y-6 animate-fade-up stagger-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Concept Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.concepts.map((concept) => (
                  <div key={concept.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{concept.name}</span>
                      <span className={`text-sm font-bold ${
                        concept.masteryLevel >= 80 ? 'text-success' :
                        concept.masteryLevel >= 60 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {concept.masteryLevel}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          concept.masteryLevel >= 80 ? 'bg-success' :
                          concept.masteryLevel >= 60 ? 'bg-warning' : 'bg-destructive'
                        }`}
                        style={{ width: `${concept.masteryLevel}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{concept.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-primary">{completedClasses.length}</p>
                  <p className="text-xs text-muted-foreground">Classes Done</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-accent">{classesWithQuiz.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Quizzes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-success">{course.concepts.filter(c => c.masteryLevel >= 80).length}</p>
                  <p className="text-xs text-muted-foreground">Mastered Topics</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-warning">{course.concepts.filter(c => c.masteryLevel < 60).length}</p>
                  <p className="text-xs text-muted-foreground">Needs Work</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Sub-component for class list items
interface ClassListItemProps {
  classItem: ScheduledClass;
  courseColor: string;
  index: number;
  onClick: () => void;
}

function ClassListItem({ classItem, courseColor, index, onClick }: ClassListItemProps) {
  const isCompleted = classItem.status === 'completed';
  const isLive = classItem.status === 'live';

  return (
    <Card 
      variant="interactive"
      className="group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted ? 'bg-success/20' : isLive ? 'bg-accent/20' : 'bg-secondary'
            }`}
          >
            {isLive ? (
              <Play className="w-5 h-5 text-accent" />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{classItem.title}</h3>
              {isLive && (
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
              )}
              {classItem.quizAvailable && (
                <Badge variant="outline" className="text-accent border-accent">
                  Quiz Ready
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(classItem.startTime), 'MMM d, h:mm a')}
              </span>
              {classItem.content?.topics && (
                <span className="truncate">
                  {classItem.content.topics.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
