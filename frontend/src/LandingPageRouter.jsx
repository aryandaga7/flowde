// Modified LandingPageRouter.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import App from './App';

const LandingPageRouter = () => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('access_token') !== null;

  return (
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* App routes - these should be protected */}
        <Route 
          path="/app/*" 
          element={isAuthenticated ? <App /> : <Navigate to="/login" />} 
        />
        
        {/* Auth routes with state initialization */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <App view="login" authView="login" />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <App view="login" authView="signup" />
        } />
        <Route path="/terms" element={
          <App view="login" authView="terms" />
        } />
        <Route path="/privacy" element={
          <App view="login" authView="privacy" />
        } />
        
        {/* Dashboard route - redirect to app if authenticated */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <App /> : <Navigate to="/login" />} 
        />
        
        {/* Catch all route - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default LandingPageRouter;