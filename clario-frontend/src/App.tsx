import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import WorkspaceDetail from "@/pages/WorkspaceDetail";
import ChatbotShell from "@/pages/ChatbotShell";
import ApiDocs from "@/pages/ApiDocs";
import WidgetClient from "@/pages/WidgetClient";
import TelegramIntegration from "@/pages/TelegramIntegration";

const FullScreenLoader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 ring-8 ring-primary/5" />
            <div className="absolute inset-0 animate-pulse rounded-2xl border border-primary/30 bg-primary/20" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Loading workspace
            </h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare your dashboard.
            </p>
          </div>

          <div className="mt-2 flex w-full gap-2">
            <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
            <div className="h-2 flex-1 animate-pulse rounded-full bg-primary/40 [animation-delay:120ms]" />
            <div className="h-2 flex-1 animate-pulse rounded-full bg-muted [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Public Route Wrapper
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:workspaceId/docs"
              element={
                <ProtectedRoute>
                  <ApiDocs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:workspaceId/chatbots/:chatbotId"
              element={
                <ProtectedRoute>
                  <ChatbotShell />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:workspaceId/chatbots/:chatbotId/telegram"
              element={
                <ProtectedRoute>
                  <TelegramIntegration />
                </ProtectedRoute>
              }
            />
            <Route path="/widget/:widgetToken" element={<WidgetClient />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}