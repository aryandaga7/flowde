// Updated Login.jsx with modern flow-themed styling
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi';
import { googleLogin } from '../services/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import FlowBackground from './FlowBackground';
import FlowSvgBackground from './FlowSvgBackground';
import '../styles/AuthStyles.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = ({ onAuthSuccess, switchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    // Load the Google Sign-In API script
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        
        // Render the button (optional, we'll use our custom button)
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline', 
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            width: 375
          }
        );
      };
    };
    
    loadGoogleScript();
    
    // Cleanup
    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle Google Sign-In response
  const handleGoogleResponse = async (response) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await googleLogin(response.credential);
      onAuthSuccess(result);
    } catch (err) {
      setError("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, { email, password });
      localStorage.setItem('access_token', response.data.access_token);
      onAuthSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <FlowSvgBackground />
      
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="flowde-logo">flowde</h1>
          <p className="flowde-tagline">Visual Project Planning</p>
        </div>
        
        <div className="auth-header">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to access your projects</p>
        </div>
        
        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <div className="input-wrapper">
              <FiMail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label className="input-label" htmlFor="password">Password</label>
              <a 
                href="#" 
                className="forgot-password" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsForgotPasswordOpen(true); 
                }}
              >
                Forgot password?
              </a>
            </div>
            <div className="input-wrapper">
              <FiLock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
            {!isLoading && <FiArrowRight size={16} />}
          </button>
        </form>
        
        <div className="auth-divider">
          <span className="auth-divider-text">OR</span>
        </div>
        
        <div id="google-signin-button" className="google-button-container"></div>
        
        <div className="auth-switch">
          <span className="auth-switch-text">Don't have an account? </span>
          <button 
            type="button"
            className="auth-switch-button"
            onClick={() => switchToSignup()}
          >
            Sign up
          </button>
        </div>
      </div>
      
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
    </div>
  );
};

export default Login;