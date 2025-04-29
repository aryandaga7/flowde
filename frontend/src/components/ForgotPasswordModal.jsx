import React, { useState } from 'react';
import { forgotPassword } from '../services/api';
import { FiMail, FiX } from 'react-icons/fi';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      setIsSuccess(true);
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose}>
          <FiX size={20} />
        </button>
        
        <h2 style={styles.title}>Reset Your Password</h2>
        
        {!isSuccess ? (
          <>
            <p style={styles.description}>
              Enter your email address, and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="reset-email">Email</label>
                <div style={styles.inputWrapper}>
                  <FiMail size={16} style={styles.inputIcon} />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              {message && <div style={isSuccess ? styles.success : styles.error}>{message}</div>}
              
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={styles.successContainer}>
            <div style={styles.success}>{message}</div>
            <button style={styles.closeModalButton} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg, 12px)',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    position: 'relative',
    boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--neutral-500, #6B7280)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--neutral-900, #111827)',
    marginBottom: '12px',
  },
  description: {
    fontSize: '14px',
    color: 'var(--neutral-600, #4B5563)',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--neutral-700, #374151)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--neutral-400, #9CA3AF)',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    backgroundColor: 'white',
    border: '1px solid var(--neutral-200, #E5E7EB)',
    borderRadius: 'var(--border-radius-md, 8px)',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    backgroundColor: 'var(--primary-600, #0070F3)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md, 8px)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--error, #EF4444)',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-md, 8px)',
    fontSize: '14px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: 'var(--success, #22C55E)',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-md, 8px)',
    fontSize: '14px',
    border: '1px solid rgba(34, 197, 94, 0.2)',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  closeModalButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    backgroundColor: 'var(--neutral-100, #F3F4F6)',
    color: 'var(--neutral-700, #374151)',
    border: 'none',
    borderRadius: 'var(--border-radius-md, 8px)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default ForgotPasswordModal;