import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScheduledClass } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, PlayCircle, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleCardProps {
  classItem: ScheduledClass;
  className?: string;
  onClick?: () => void;
}

export function ScheduleCard({ classItem, className, onClick }: ScheduleCardProps) {
  const getStatusConfig = () => {
    switch (classItem.status) {
      case 'live':
        return {
          icon: PlayCircle,
          label: 'Live Now',
          variant: 'default' as const,
          className: 'bg-error text-error-foreground animate-pulse-soft',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          variant: 'secondary' as const,
          className: 'bg-success/10 text-success border-success/20',
        };
      default:
        return {
          icon: Clock,
          label: format(new Date(classItem.startTime), 'h:mm a'),
          variant: 'outline' as const,
          className: '',
        };
    }
  };

  const status = getStatusConfig();

  return (
    <Card 
      variant="interactive"
      className={cn('group', className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Time Column */}
          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-foreground">
              {format(new Date(classItem.startTime), 'HH:mm')}
            </p>
            <p className="text-xs text-muted-foreground uppercase">
              {format(new Date(classItem.startTime), 'EEE')}
            </p>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-normal">
                {classItem.courseName}
              </Badge>
              {classItem.quizAvailable && (
                <Badge className="bg-accent/10 text-accent border-accent/20 text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Quiz Ready
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground truncate">{classItem.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{classItem.description}</p>
          </div>

          {/* Status & Action */}
          <div className="flex items-center gap-3">
            <Badge className={cn('flex items-center gap-1', status.className)}>
              <status.icon className="w-3 h-3" />
              {status.label}
            </Badge>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
