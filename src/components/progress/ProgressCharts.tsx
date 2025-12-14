import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressChartsProps {
  assessmentHistory: Array<{
    id: string;
    type: string;
    title: string;
    percentage: number;
    completedAt: Date;
    timeSpent: number;
  }>;
  conceptMastery: Record<string, number>;
}

export function ProgressCharts({ assessmentHistory, conceptMastery }: ProgressChartsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  // Generate mock weekly/monthly data based on assessment history
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filterByRange = (date: Date) => {
    const d = new Date(date);
    if (timeRange === 'week') return d >= weekAgo;
    if (timeRange === 'month') return d >= monthAgo;
    return true;
  };

  const filteredHistory = assessmentHistory.filter(h => filterByRange(h.completedAt));

  // Create trend data for line chart
  const trendData = generateTrendData(filteredHistory, timeRange);
  
  // Mastery breakdown by concept for bar chart
  const conceptData = Object.entries(conceptMastery).map(([id, mastery]) => ({
    concept: id.replace('c', 'C').replace('-', '.'),
    mastery,
    fill: mastery >= 70 ? 'hsl(var(--chart-2))' : mastery >= 50 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))'
  })).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Performance Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Trend
          </CardTitle>
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Concept Mastery Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Concept Mastery Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conceptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  type="category" 
                  dataKey="concept" 
                  tick={{ fontSize: 12 }}
                  width={50}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Mastery']}
                />
                <Bar 
                  dataKey="mastery" 
                  radius={[0, 4, 4, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-muted-foreground">Strong (≥70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-muted-foreground">Needs Work (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Weak (&lt;50%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateTrendData(history: Array<{ percentage: number; completedAt: Date }>, range: 'week' | 'month' | 'all') {
  // Group by date and calculate average
  const now = new Date();
  const points = range === 'week' ? 7 : range === 'month' ? 30 : 60;
  const data: { date: string; score: number }[] = [];
  
  // Create mock trend data with slight variations
  const baseScore = history.length > 0 
    ? history.reduce((sum, h) => sum + h.percentage, 0) / history.length 
    : 65;
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Find any actual test on this day
    const dayTests = history.filter(h => {
      const testDate = new Date(h.completedAt);
      return testDate.toDateString() === date.toDateString();
    });
    
    const score = dayTests.length > 0
      ? Math.round(dayTests.reduce((sum, t) => sum + t.percentage, 0) / dayTests.length)
      : null;
    
    if (score !== null || i % (range === 'week' ? 1 : range === 'month' ? 3 : 7) === 0) {
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: score !== null ? score : Math.round(baseScore + (Math.random() - 0.5) * 20)
      });
    }
  }
  
  return data.length > 0 ? data : [
    { date: 'Week 1', score: 60 },
    { date: 'Week 2', score: 65 },
    { date: 'Week 3', score: 68 },
    { date: 'Week 4', score: 72 },
  ];
}
