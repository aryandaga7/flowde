// Updated Signup.jsx with modern flow-themed styling
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiLock, FiMail, FiUser, FiArrowRight } from 'react-icons/fi';
import { googleLogin } from '../services/api';
import FlowBackground from './FlowBackground';
import FlowSvgBackground from './FlowSvgBackground';
import '../styles/AuthStyles.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Signup = ({ onAuthSuccess, switchToLogin, viewTerms, viewPrivacy }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
          document.getElementById('google-signup-button'),
          { 
            theme: 'outline', 
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signup_with',
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
      setError("Google signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/signup', {
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
      onAuthSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
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
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Start planning your projects visually</p>
        </div>
        
        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="input-row">
            <div className="input-group">
              <label className="input-label" htmlFor="firstName">First Name</label>
              <div className="input-wrapper">
                <FiUser size={16} className="input-icon" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="auth-input"
                  placeholder="First Name"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="lastName">Last Name</label>
              <div className="input-wrapper">
                <FiUser size={16} className="input-icon" />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="auth-input"
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
          </div>
          
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
            <label className="input-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Create a password"
                required
              />
            </div>
            <p className="password-hint">Must be at least 8 characters</p>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
            {!isLoading && <FiArrowRight size={16} />}
          </button>
        </form>
        
        <div className="auth-divider">
          <span className="auth-divider-text">OR</span>
        </div>
        
        <div id="google-signup-button" className="google-button-container"></div>
        
        <div className="auth-switch">
          <span className="auth-switch-text">Already have an account? </span>
          <button 
            type="button"
            className="auth-switch-button"
            onClick={() => switchToLogin()}
          >
            Sign in
          </button>
        </div>

        <p className="auth-terms">
          By creating an account, you agree to our{' '}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              viewTerms();
            }} 
            className="auth-terms-link"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              viewPrivacy();
            }} 
            className="auth-terms-link"
          >
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  );
};

export default Signup;