import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { AIChatDrawer } from '@/components/chat/AIChatDrawer';
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  Calendar,
  ClipboardList,
  FileText,
  TrendingUp,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Tests', path: '/assessments' },
  { icon: History, label: 'History', path: '/test-history' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: ClipboardList, label: 'Homework', path: '/homework' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isChatOpen, toggleChat } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">EduLearn</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'gap-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleChat}
                className="hidden sm:flex gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                AI Help
              </Button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card animate-fade-in">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
              <hr className="border-border my-2" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={toggleChat}
              >
                <MessageCircle className="w-4 h-4" />
                AI Help
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* AI Chat Drawer */}
      <AIChatDrawer />

      {/* Mobile Chat FAB */}
      <Button
        variant="accent"
        size="iconLg"
        className="fixed bottom-6 right-6 md:hidden rounded-full shadow-accent z-40"
        onClick={toggleChat}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}
