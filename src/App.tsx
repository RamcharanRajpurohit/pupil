import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import LoginPage from "./pages/LoginPage";
// Hidden routes - will be enabled later when functionality is ready
// import DashboardPage from "./pages/DashboardPage";
// import CoursePage from "./pages/CoursePage";
// import ClassPage from "./pages/ClassPage";
// import QuizPage from "./pages/QuizPage";
// import HomeworkPage from "./pages/HomeworkPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import AssessmentPage from "./pages/AssessmentPage";
import UploadedAssessmentPage from "./pages/UploadedAssessmentPage";
// import ProgressPage from "./pages/ProgressPage";
// import CourseProgressPage from "./pages/CourseProgressPage";
// import TestHistoryPage from "./pages/TestHistoryPage";
// import TestsPage from "./pages/TestsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const LoginRoute = () => {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? <Navigate to="/assessments" replace /> : <LoginPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/assessments" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          
          {/* ACTIVE ROUTES */}
          <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />
          <Route path="/assessment/:assessmentId" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
          <Route path="/uploaded-assessment/:uploadId" element={<ProtectedRoute><UploadedAssessmentPage /></ProtectedRoute>} />
          
          {/* HIDDEN ROUTES - Will be enabled when functionality is ready */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
          {/* <Route path="/course/:courseId" element={<CoursePage />} /> */}
          {/* <Route path="/class/:classId" element={<ClassPage />} /> */}
          {/* <Route path="/quiz/:classId" element={<QuizPage />} /> */}
          {/* <Route path="/homework" element={<HomeworkPage />} /> */}
          {/* <Route path="/progress" element={<ProgressPage />} /> */}
          {/* <Route path="/progress/course/:courseId" element={<CourseProgressPage />} /> */}
          {/* <Route path="/test-history" element={<TestHistoryPage />} /> */}
          {/* <Route path="/tests" element={<TestsPage />} /> */}
          {/* <Route path="/courses" element={<DashboardPage />} /> */}
          {/* <Route path="/schedule" element={<DashboardPage />} /> */}
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
