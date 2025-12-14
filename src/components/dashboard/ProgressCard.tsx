import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { StudentProgress, Course } from '@/types';
import { Flame, Target, Clock, TrendingUp, Brain } from 'lucide-react';

interface ProgressCardProps {
  progress: StudentProgress | null;
  courses: Course[];
}

export function ProgressCard({ progress, courses }: ProgressCardProps) {
  if (!progress) return null;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <Card variant="gradient" className="overflow-hidden">
        <div className="gradient-accent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-foreground/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-accent-foreground/80 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-accent-foreground">{progress.streakDays} days</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overall Mastery</p>
              <p className="text-xl font-bold text-foreground">{progress.overallMastery}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time Spent</p>
              <p className="text-xl font-bold text-foreground">{formatTime(progress.totalTimeSpent)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Concept Mastery */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Concept Mastery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses[0]?.concepts.slice(0, 4).map((concept) => (
            <div key={concept.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{concept.name}</span>
                <span className="font-medium text-foreground">{concept.masteryLevel}%</span>
              </div>
              <Progress 
                value={concept.masteryLevel} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Areas to Focus */}
      {progress.weakAreas.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <TrendingUp className="w-4 h-4" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {progress.weakAreas.map((area) => (
                <span 
                  key={area}
                  className="px-3 py-1 text-sm bg-warning/10 text-warning rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
