import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Loader2, 
  X, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assessment } from '@/types';
import { questionBank } from '@/services/mockData';

interface FileUploadQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';

export function FileUploadQuizDialog({ open, onOpenChange }: FileUploadQuizDialogProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState([10]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('mixed');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'doc', 'docx', 'txt', 'pptx', 'ppt'].includes(ext || '');
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['ppt', 'pptx'].includes(ext || '')) return '📊';
    return '📃';
  };

  const handleGenerateQuiz = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock questions based on difficulty
    let filteredQuestions = [...questionBank];
    if (difficulty !== 'mixed') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // Shuffle and select
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount[0], shuffled.length));
    
    const assessment: Assessment = {
      id: `file-quiz-${Date.now()}`,
      type: 'practice',
      title: `Quiz from: ${uploadedFiles[0].name}${uploadedFiles.length > 1 ? ` +${uploadedFiles.length - 1} more` : ''}`,
      description: `AI-generated quiz from your uploaded materials`,
      topics: ['Uploaded Material'],
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      status: 'available',
      createdAt: new Date(),
      difficulty,
      estimatedTime: selectedQuestions.length * 2,
    };
    
    // Save to history
    const history = JSON.parse(localStorage.getItem('practiceTestHistory') || '[]');
    history.unshift({
      ...assessment,
      completedAt: null,
      score: null,
      fromFiles: uploadedFiles.map(f => f.name),
      customPrompt: customPrompt || undefined,
    });
    localStorage.setItem('practiceTestHistory', JSON.stringify(history.slice(0, 20)));
    
    setIsGenerating(false);
    onOpenChange(false);
    setUploadedFiles([]);
    setCustomPrompt('');
    navigate(`/assessment/${assessment.id}`, { state: { assessment } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Quiz from Study Material
          </DialogTitle>
          <DialogDescription>
            Upload your PDFs, documents, or presentations to generate a custom quiz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              uploadedFiles.length > 0
                ? "border-primary/30 bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Click to upload files</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, TXT, PPT, PPTX
            </p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded Files</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                  >
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Selection */}
          <div className="space-y-3">
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
                    id={`file-diff-${opt.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`file-diff-${opt.value}`}
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
          <div className="space-y-3">
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
          </div>

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Custom Instructions (Optional)
            </Label>
            <Textarea
              placeholder="E.g., 'Focus on chapter 5 concepts', 'Include numerical problems only', 'Create application-based questions', 'Add questions about thermodynamics laws'..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Specify any additional requirements for question generation
            </p>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <span>Estimated time:</span>
            <span className="font-medium">{questionCount[0] * 2} minutes</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={uploadedFiles.length === 0 || isGenerating}
              onClick={handleGenerateQuiz}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
