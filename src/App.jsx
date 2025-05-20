
import React from 'react';
import { backendurl } from './config/config';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Homepage from './pages/Homepage';
import SignupPage from './pages/SignupPage';
import PostJobPage from './pages/PostJobPage';
import AdminJobReviewPage from './pages/Admin/AdminJobReviewPage';
import AdminJobManagementPage from './pages/Admin/AdminJobManagementPage';
import AdminJobDeliveryPage from './pages/Admin/AdminJobDeliveryPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ContributorDashboardPage from './pages/Contributor/ContributorDashboardPage'; // Import the contributor dashboard
import Navbar from './components/Navbar';
import JobDetailPage from './pages/JobDetailPage';
import JobPaymentPage from './pages/JobPaymentPage';

export const Backendurl = backendurl;

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect users to their appropriate dashboard based on role
    if (user.role === 'client') {
      return <Navigate to="/client-dashboard" replace />;
    } else if (user.role === 'contributor') {
      return <Navigate to="/contributor-dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/jobs/manage" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Redirect to the appropriate dashboard based on role
    if (user.role === 'client') {
      return <Navigate to="/client-dashboard" replace />;
    } else if (user.role === 'contributor') {
      return <Navigate to="/contributor-dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/jobs/manage" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Layout component that includes the Navbar
const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Role-based dashboard handler
const DashboardSelector = () => {
  const { user } = useAuth();
  
  if (user.role === 'client') {
    return <Navigate to="/client-dashboard" replace />;
  } else if (user.role === 'contributor') {
    return <Navigate to="/contributor-dashboard" replace />;
  } else if (user.role === 'admin') {
    return <Navigate to="/admin/jobs/manage" replace />;
  } else {
    return <Homepage />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Homepage /></Layout>} />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Layout><LoginPage /></Layout>
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Layout><SignupPage /></Layout>
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardSelector />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/post-job" 
            element={
              <ProtectedRoute allowedRoles={['client', 'contributor']}>
                <Layout><PostJobPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/jobs/review" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><AdminJobReviewPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/jobs/manage" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><AdminJobManagementPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/jobs/:id/manage" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><AdminJobDeliveryPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Client Dashboard - accessible by both clients and contributors */}
          <Route 
            path="/client-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['client', 'contributor']}>
                <Layout><ClientDashboardPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Contributor Dashboard - accessible only by contributors */}
          <Route 
            path="/contributor-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['contributor']}>
                <Layout><ContributorDashboardPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout><Homepage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Job Details Route */}
          <Route 
            path="/jobs/:id" 
            element={
              <ProtectedRoute>
                <Layout><JobDetailPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Accept Job Offer Route */}
          <Route 
            path="/jobs/:id/accept" 
            element={
              <ProtectedRoute allowedRoles={['client', 'contributor']}>
                <Layout><JobPaymentPage /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Other pages like "How It Works" and "About" */}
          <Route 
            path="/how-it-works" 
            element={
              <Layout><Homepage /></Layout>
            } 
          />
          
          <Route 
            path="/about" 
            element={
              <Layout><Homepage /></Layout>
            } 
          />
          
          {/* 404 - Redirect to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;