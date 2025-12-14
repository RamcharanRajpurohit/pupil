import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Send, Loader2, Bot, User, Lightbulb, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIChatDrawer() {
  const { isChatOpen, toggleChat, chatMessages, addChatMessage, clearChat } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    setIsLoading(true);
    try {
      const response = await api.sendChatMessage(userMessage);
      addChatMessage({
        role: 'assistant',
        content: response.content,
      });
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { icon: HelpCircle, label: "I'm stuck", prompt: "I'm stuck on this problem, can you help?" },
    { icon: Lightbulb, label: 'Give me a hint', prompt: 'Can you give me a hint without the full solution?' },
    { icon: BookOpen, label: 'Explain concept', prompt: 'Can you explain the underlying concept?' },
  ];

  if (!isChatOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={toggleChat}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">AI Study Helper</h2>
              <p className="text-xs text-muted-foreground">Get hints, not answers</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleChat}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-2">How can I help?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto">
                I'll guide you towards the solution without giving direct answers. This helps you learn better!
              </p>
              
              {/* Quick Prompts */}
              <div className="space-y-2">
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt.label}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setInput(prompt.prompt);
                    }}
                  >
                    <prompt.icon className="w-4 h-4 text-primary" />
                    {prompt.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <Card className={cn(
                    'p-3 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <Card className="p-3 bg-secondary">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </div>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for help..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {chatMessages.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 text-muted-foreground"
              onClick={clearChat}
            >
              Clear conversation
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
