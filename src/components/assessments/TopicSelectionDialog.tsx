import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { mockCourses } from '@/services/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Loader2, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopicSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTest: (assessmentId: string) => void;
  initialTopics?: string[];
  initialDifficulty?: DifficultyLevel;
  initialQuestionCount?: number;
}

interface TopicGroup {
  courseId: string;
  courseName: string;
  color: string;
  topics: { id: string; name: string; masteryLevel: number }[];
}

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';

export function TopicSelectionDialog({ 
  open, 
  onOpenChange, 
  onStartTest,
  initialTopics = [],
  initialDifficulty = 'mixed',
  initialQuestionCount = 10
}: TopicSelectionDialogProps) {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopics);
  const [questionCount, setQuestionCount] = useState([initialQuestionCount]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);

  useEffect(() => {
    // Group topics by course
    const groups: TopicGroup[] = mockCourses.map(course => ({
      courseId: course.id,
      courseName: course.title,
      color: course.color,
      topics: course.concepts.map(c => ({
        id: c.id,
        name: c.name,
        masteryLevel: c.masteryLevel,
      })),
    }));
    setTopicGroups(groups);
  }, []);

  // Update state when initial values change (for retry functionality)
  useEffect(() => {
    if (open) {
      setSelectedTopics(initialTopics);
      setDifficulty(initialDifficulty);
      setQuestionCount([initialQuestionCount]);
    }
  }, [open, initialTopics, initialDifficulty, initialQuestionCount]);

  const handleTopicToggle = (topicName: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName]
    );
  };

  const handleSelectAllInCourse = (courseTopics: { name: string }[]) => {
    const topicNames = courseTopics.map(t => t.name);
    const allSelected = topicNames.every(name => selectedTopics.includes(name));
    
    if (allSelected) {
      setSelectedTopics(prev => prev.filter(t => !topicNames.includes(t)));
    } else {
      setSelectedTopics(prev => [...new Set([...prev, ...topicNames])]);
    }
  };

  const handleGenerateTest = async () => {
    if (selectedTopics.length === 0) return;
    
    setIsGenerating(true);
    try {
      const assessment = await api.generatePracticeTest(selectedTopics, questionCount[0], difficulty);
      
      // Save to history
      const history = JSON.parse(localStorage.getItem('practiceTestHistory') || '[]');
      history.unshift({
        ...assessment,
        completedAt: null,
        score: null,
        selectedTopics,
        selectedDifficulty: difficulty,
      });
      localStorage.setItem('practiceTestHistory', JSON.stringify(history.slice(0, 20)));
      
      onOpenChange(false);
      navigate(`/assessment/${assessment.id}`, { state: { assessment } });
    } catch (error) {
      console.error('Failed to generate practice test:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 70) return 'text-green-600 bg-green-100';
    if (level >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Practice Test
          </DialogTitle>
          <DialogDescription>
            Select topics you want to practice. Questions will be randomly generated from your selected areas.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 pb-4">
            {/* Selected Topics Summary */}
            {selectedTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-sm text-muted-foreground mr-2">Selected:</span>
                {selectedTopics.map(topic => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => handleTopicToggle(topic)}
                  >
                    {topic} ×
                  </Badge>
                ))}
              </div>
            )}

            {/* Topic Selection - Accordion */}
            <Accordion type="multiple" defaultValue={topicGroups.map(g => g.courseId)} className="space-y-2">
              {topicGroups.map(group => {
                const selectedCount = group.topics.filter(t => selectedTopics.includes(t.name)).length;
                const allSelected = selectedCount === group.topics.length;
                
                return (
                  <AccordionItem
                    key={group.courseId}
                    value={group.courseId}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-medium">{group.courseName}</span>
                        {selectedCount > 0 && (
                          <Badge variant="outline" className="ml-auto mr-2">
                            {selectedCount}/{group.topics.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3">
                        {/* Select All */}
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Checkbox
                            id={`select-all-${group.courseId}`}
                            checked={allSelected}
                            onCheckedChange={() => handleSelectAllInCourse(group.topics)}
                          />
                          <Label
                            htmlFor={`select-all-${group.courseId}`}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            Select all topics
                          </Label>
                        </div>
                        
                        {/* Individual Topics */}
                        <div className="grid gap-2">
                          {group.topics.map(topic => (
                            <div
                              key={topic.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                selectedTopics.includes(topic.name)
                                  ? "bg-primary/5 border-primary/30"
                                  : "hover:bg-secondary/50"
                              )}
                              onClick={() => handleTopicToggle(topic.name)}
                            >
                              <Checkbox
                                checked={selectedTopics.includes(topic.name)}
                                onCheckedChange={() => handleTopicToggle(topic.name)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{topic.name}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getMasteryColor(topic.masteryLevel))}
                              >
                                {topic.masteryLevel}% mastery
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Difficulty Selection */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">Difficulty Level</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as DifficultyLevel)}
                className="grid grid-cols-4 gap-2"
              >
                {[
                  { value: 'easy', label: 'Easy', color: 'text-green-600' },
                  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
                  { value: 'hard', label: 'Hard', color: 'text-red-600' },
                  { value: 'mixed', label: 'Mixed', color: 'text-primary' },
                ].map((opt) => (
                  <div key={opt.value}>
                    <RadioGroupItem
                      value={opt.value}
                      id={`diff-${opt.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`diff-${opt.value}`}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all",
                        "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                        "hover:bg-secondary/50"
                      )}
                    >
                      <span className={cn("text-sm font-medium", difficulty === opt.value && opt.color)}>
                        {opt.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Question Count */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Number of Questions</Label>
                <span className="text-sm font-bold text-primary">{questionCount[0]}</span>
              </div>
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                min={5}
                max={30}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 (Quick)</span>
                <span>15 (Standard)</span>
                <span>30 (Comprehensive)</span>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
              <span>Estimated time:</span>
              <span className="font-medium">{questionCount[0] * 2} minutes</span>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex-shrink-0 flex gap-3 p-6 border-t bg-background">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={selectedTopics.length === 0 || isGenerating}
            onClick={handleGenerateTest}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Start Practice ({selectedTopics.length} topics)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
