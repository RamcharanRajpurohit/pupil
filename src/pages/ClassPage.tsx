import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScheduledClass, Course } from '@/types';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  Clock, 
  Download, 
  FileText, 
  Loader2, 
  Play,
  Target,
  Video
} from 'lucide-react';
import { format } from 'date-fns';

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();
  const [classData, setClassData] = useState<ScheduledClass | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadClassData = async () => {
      if (!classId) return;
      
      setIsLoading(true);
      try {
        const classInfo = await api.getClassById(classId);
        setClassData(classInfo);
        
        if (classInfo) {
          const courseInfo = await api.getCourse(classInfo.courseId);
          setCourse(courseInfo);
        }
      } catch (error) {
        console.error('Failed to load class data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClassData();
  }, [classId, isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-pulse-soft">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading class details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!classData) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Class not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = classData.status === 'completed';
  const isLive = classData.status === 'live';
  const isUpcoming = classData.status === 'upcoming';

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'video': return Video;
      default: return Download;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Back Button & Header */}
        <div className="animate-fade-up">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => course ? navigate(`/course/${course.id}`) : navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {course?.title || 'Dashboard'}
          </Button>

          <div className="flex items-start gap-6">
            <div 
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                isCompleted ? 'bg-success/20' : isLive ? 'bg-accent/20' : 'bg-primary/20'
              }`}
            >
              {isLive ? (
                <Play className="w-8 h-8 text-accent" />
              ) : (
                <BookOpen className="w-8 h-8" style={{ color: course?.color || 'hsl(var(--primary))' }} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{classData.title}</h1>
                {isLive && (
                  <Badge variant="destructive" className="animate-pulse">
                    LIVE NOW
                  </Badge>
                )}
                {isCompleted && (
                  <Badge variant="outline" className="text-success border-success">
                    Completed
                  </Badge>
                )}
                {isUpcoming && (
                  <Badge variant="secondary">
                    Upcoming
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(classData.startTime), 'EEEE, MMMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {format(new Date(classData.startTime), 'h:mm a')} - {format(new Date(classData.endTime), 'h:mm a')}
                </span>
              </div>
              <p className="text-muted-foreground">{classData.description}</p>
            </div>
          </div>
        </div>

        {/* Quiz CTA */}
        {classData.quizAvailable && (
          <Card className="animate-fade-up stagger-1 border-accent bg-gradient-to-r from-accent/10 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                    <Target className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Quiz Ready!</h2>
                    <p className="text-muted-foreground">
                      Test your understanding of today's topics. Complete the quiz to unlock your personalized homework.
                    </p>
                  </div>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate(`/quiz/${classData.id}`)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Class Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topics Covered */}
            {classData.content?.topics && classData.content.topics.length > 0 && (
              <Card className="animate-fade-up stagger-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Topics Covered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {classData.content.topics.map((topic, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="px-3 py-1.5 text-sm"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Class Notes */}
            {classData.content?.notes && (
              <Card className="animate-fade-up stagger-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Class Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {classData.content.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pre-class / Post-class Message */}
            {isUpcoming && (
              <Card className="animate-fade-up stagger-3 border-dashed">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Class Not Started Yet</h3>
                  <p className="text-muted-foreground">
                    This class is scheduled for {format(new Date(classData.startTime), 'MMMM d, yyyy')} at{' '}
                    {format(new Date(classData.startTime), 'h:mm a')}. Check back after the class for quiz and materials.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Materials */}
          <div className="space-y-6 animate-fade-up stagger-4">
            {/* Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classData.content?.materials && classData.content.materials.length > 0 ? (
                  <div className="space-y-3">
                    {classData.content.materials.map((material) => {
                      const Icon = getMaterialIcon(material.type);
                      return (
                        <button
                          key={material.id}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {material.title}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase">
                              {material.type}
                            </p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No materials available yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Course Info */}
            {course && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${course.color}20` }}
                    >
                      <BookOpen className="w-5 h-5" style={{ color: course.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {course.instructor}
                      </p>
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
