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
import { 
  Upload, 
  Loader2, 
  X, 
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';

interface FileUploadQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileUploadQuizDialog({ open, onOpenChange }: FileUploadQuizDialogProps) {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf') {
        setUploadedFile(file);
        setUploadStatus('idle');
        setUploadMessage('');
      } else {
        setUploadStatus('error');
        setUploadMessage('Only PDF files are supported');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  const handleUploadAndExtract = async () => {
    if (!uploadedFile || !user?.id) return;
    
    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');
    
    try {
      const result = await api.uploadPDFQuestions(user.id, uploadedFile);
      
      setUploadStatus('success');
      setUploadMessage(`Successfully extracted ${result.total_questions} questions from PDF!`);
      
      // Wait a moment to show success message
      setTimeout(() => {
        onOpenChange(false);
        removeFile();
        // Refresh the assessments page if needed
        window.dispatchEvent(new CustomEvent('refreshAssessments'));
      }, 2000);
      
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      setUploadStatus('error');
      setUploadMessage(error.message || 'Failed to extract questions from PDF');
    } finally {
      setIsUploading(false);
    }
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
              uploadedFile
                ? "border-primary/30 bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
            )}
            onClick={() => !uploadedFile && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Click to upload PDF file</p>
            <p className="text-xs text-muted-foreground mt-1">
              Only PDF files supported
            </p>
          </div>

          {/* Uploaded File */}
          {uploadedFile && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded File</Label>
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                <span className="text-lg">📄</span>
                <span className="flex-1 text-sm truncate">{uploadedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </span>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={removeFile}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400 flex-1">
                {uploadMessage}
              </p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">
                {uploadMessage}
              </p>
            </div>
          )}

          {/* Info Text */}
          <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Upload a PDF containing questions</li>
              <li>AI extracts all questions automatically</li>
              <li>Questions are saved to your account</li>
              <li>Access them anytime from the Uploaded Assessments tab</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!uploadedFile || isUploading}
              onClick={handleUploadAndExtract}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
