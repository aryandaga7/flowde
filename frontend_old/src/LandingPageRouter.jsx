// Replace the entire router with this implementation
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import App from './App';
import Login from './components/Login';
import Signup from './components/Signup';
import Terms from './components/Terms';
import Privacy from './components/Privacy';

// Protected route component
const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('access_token') !== null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const LandingPageRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<App />} />
          <Route path="/app/*" element={<App />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default LandingPageRouter;