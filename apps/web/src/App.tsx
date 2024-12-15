import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/Auth';
import { Layout } from './components/Layout';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { ArticleCacheProvider } from './contexts/ArticleCacheContext';
import { IssuesProvider, useIssues } from './contexts/IssuesContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/auth" state={{ from: location }} replace />
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (loading) {
    return null;
  }

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to={from} replace />
  );
}

function AppContent() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { loading: issuesLoading } = useIssues();
  
  // Only show loading screen if we're authenticated and loading issues,
  // or if we're still checking authentication
  const showLoading = authLoading || (isAuthenticated && issuesLoading);
  
  if (showLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-200 z-50">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ArticleCacheProvider>
            <IssuesProvider>
              <AppContent />
            </IssuesProvider>
          </ArticleCacheProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;