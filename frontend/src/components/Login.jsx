import React, { useState } from 'react';
import axios from 'axios';
import { FiLock, FiMail, FiLogIn } from 'react-icons/fi';

const Login = ({ onAuthSuccess, switchToSignup}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/login', { email, password });
      localStorage.setItem('access_token', response.data.access_token);
      onAuthSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <FiLogIn size={32} style={styles.icon} />
          <h1 style={styles.title}>Welcome to CSPathFinder</h1>
          <p style={styles.subtitle}>Computer Science Project Management System</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FiMail size={18} />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="student@university.edu"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FiLock size={18} />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          <div style={styles.switchContainer}>
            <span style={styles.switchText}>Don't have an account? </span>
            <button 
              type="button"
              style={styles.switchButton}
              onClick={() => switchToSignup()}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  icon: {
    color: '#3b82f6',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    color: '#0f172a',
    margin: '0 0 8px 0',
    fontWeight: 600
  },
  subtitle: {
    color: '#64748b',
    margin: 0,
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '14px'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
    }
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb'
    },
    ':disabled': {
      backgroundColor: '#93c5fd',
      cursor: 'not-allowed'
    }
  },
  switchContainer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px'
  },
  switchText: {
    color: '#64748b'
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    padding: '4px',
    fontWeight: 500,
    ':hover': {
      textDecoration: 'underline'
    }
  }
};

export default Login;