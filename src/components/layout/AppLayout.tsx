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
  MessageCircle,
  User,
  Mail,
  Building
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  // { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Tests', path: '/assessments' },
  // { icon: History, label: 'History', path: '/test-history' },
  // { icon: TrendingUp, label: 'Progress', path: '/progress' },
  // { icon: ClipboardList, label: 'Homework', path: '/homework' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isChatOpen, toggleChat } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
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
              // onClick={() => navigate('/dashboard')}
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

              <Button
                variant="ghost"
                className="flex items-center gap-3 h-auto p-2"
                onClick={() => setIsProfileOpen(true)}
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              </Button>

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
      {/* Mobile Chat FAB */}
      <Button
        variant="accent"
        size="iconLg"
        className="fixed bottom-6 right-6 md:hidden rounded-full shadow-accent z-40"
        onClick={toggleChat}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Profile Sidebar */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription>Your account information</SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Profile Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-primary-foreground">
                  {user?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground break-all">{user?.email}</p>
                </div>
              </div>

              {user?.profile?.grade && user?.profile?.section && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="text-sm font-medium text-foreground">
                      Grade {user.profile.grade} - Section {user.profile.section}
                    </p>
                  </div>
                </div>
              )}

              {user?.institutionId && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Institution ID</p>
                    <p className="text-sm font-medium text-foreground break-all">{user.institutionId}</p>
                  </div>
                </div>
              )}

              {user?.profile?.gender && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium text-foreground capitalize">{user.profile.gender}</p>
                  </div>
                </div>
              )}

              {user?.status && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Settings className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Account Status</p>
                    <p className="text-sm font-medium text-foreground capitalize">{user.status}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-2">
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
