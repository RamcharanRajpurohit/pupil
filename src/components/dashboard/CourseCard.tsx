import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronRight, TrendingUp } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  className?: string;
  onClick?: () => void;
}

export function CourseCard({ course, className, onClick }: CourseCardProps) {
  return (
    <Card 
      variant="interactive"
      className={cn('group overflow-hidden', className)}
      onClick={onClick}
    >
      {/* Color Strip */}
      <div 
        className="h-2 w-full"
        style={{ background: course.color }}
      />
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${course.color}20` }}
          >
            <BookOpen className="w-6 h-6" style={{ color: course.color }} />
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>

        <h3 className="font-bold text-foreground mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{course.instructor}</p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{course.progress}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${course.progress}%`,
                background: course.color,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{course.completedClasses} / {course.totalClasses} classes</span>
            {course.progress > 50 && (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-3 h-3" />
                <span>On track</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
