// Updated AssignmentForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createAssignment } from '../services/api';
import { FiFileText, FiSend, FiArrowRight, FiLoader } from 'react-icons/fi';

function AssignmentForm({ onAssignmentCreated }) {
  const [assignmentInput, setAssignmentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Load saved form input on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('newAssignmentFormData');
    if (savedFormData) {
      setAssignmentInput(savedFormData);
    }
    
    // Set current app state to "new_assignment_form"
    localStorage.setItem('appState', 'new_assignment_form');
    
    return () => {
      // Only clear if navigating away (not on refresh)
      if (document.visibilityState !== 'hidden') {
        localStorage.removeItem('newAssignmentFormData');
      }
    };
  }, []);

  // Save form input as user types
  useEffect(() => {
    if (assignmentInput.trim()) {
      localStorage.setItem('newAssignmentFormData', assignmentInput);
    }
    
    // Auto-resize text area
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 300)}px`;
    }
  }, [assignmentInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignmentInput.trim()) {
      setError('Please enter project details');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make API call
      const result = await createAssignment(assignmentInput);
      
      // Clear input and form data
      setAssignmentInput('');
      localStorage.removeItem('newAssignmentFormData');
      
      // Make sure we have valid result data before proceeding
      if (!result || !result.assignment_id) {
        throw new Error('Invalid response from server');
      }
      
      // Set app state to viewing_assignment
      localStorage.setItem('appState', 'viewing_assignment');
      
      // Save the new assignment ID
      localStorage.setItem('currentAssignmentId', result.assignment_id.toString());
      
      // Call the callback with the result
      if (onAssignmentCreated) {
        // Format the result properly to match expected structure
        const formattedResult = {
          assignment_id: result.assignment_id,
          id: result.assignment_id,
          title: result.title || "New Assignment",
          description: result.description || "Assignment created successfully"
        };
        onAssignmentCreated(formattedResult);
      }
    } catch (err) {
      console.error("Error creating assignment:", err);
      setError(err.response?.data?.detail || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.heroSection}>
        <h1 style={styles.heroLogo}>flowde</h1>
        <h2 style={styles.heroTitle}>Transform Your Assignments Into Visual Flowcharts</h2>
        <p style={styles.heroSubtitle}>
          Break down complex projects into manageable steps with AI assistance
        </p>
      </div>

      <div style={styles.formContainer}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.promptCard}>
          <div style={styles.promptHeader}>
            <FiFileText size={20} style={styles.promptIcon} />
            <h3 style={styles.promptTitle}>What would you like to work on today?</h3>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={assignmentInput}
                onChange={(e) => setAssignmentInput(e.target.value)}
                style={styles.textarea}
                placeholder="Describe your assignment or project in detail. For example: 'Create a React application for managing student assignments with chat functionality'"
                rows={1}
                disabled={isLoading}
              />
              
              <button 
                type="submit" 
                style={{
                  ...styles.sendButton,
                  opacity: isLoading || !assignmentInput.trim() ? 0.6 : 1
                }}
                disabled={isLoading || !assignmentInput.trim()}
              >
                {isLoading ? (
                  <FiLoader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <FiArrowRight size={20} />
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div style={styles.examples}>
          <h4 style={styles.examplesTitle}>Try these examples:</h4>
          <div style={styles.exampleCards}>
            <button 
              style={styles.exampleCard}
              onClick={() => setAssignmentInput("Build a full-stack e-commerce website with product listings, shopping cart, and checkout functionality")}
            >
              E-commerce Website
            </button>
            <button 
              style={styles.exampleCard}
              onClick={() => setAssignmentInput("Create a mobile app for tracking daily fitness activities with progress visualization")}
            >
              Fitness Tracking App
            </button>
            <button 
              style={styles.exampleCard}
              onClick={() => setAssignmentInput("Develop a personal finance dashboard to track expenses, income, and savings goals")}
            >
              Finance Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add a keyframe for loading spinner
const spinKeyframe = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const style = document.createElement('style');
style.innerHTML = spinKeyframe;
document.head.appendChild(style);

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--neutral-50)',
    padding: '20px',
    fontFamily: 'var(--font-family)'
  },
  heroSection: {
    textAlign: 'center',
    padding: '40px 20px',
    marginBottom: '20px',
    animation: 'fadeIn 0.5s ease'
  },
  heroTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--neutral-900)',
    marginBottom: '16px',
    fontFamily: 'var(--font-family)'
  },
  heroLogo: {
    fontFamily: 'var(--font-family-logo)',
    fontSize: '3rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, var(--primary-600) 0%, var(--accent-500) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    letterSpacing: '-0.5px',
    margin: '0 0 16px 0',
    padding: 0,
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--neutral-500)',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: 1.5
  },
  formContainer: {
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    animation: 'slideInUp 0.4s ease'
  },
  promptCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    padding: '24px',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--neutral-200)',
  },
  promptHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  promptIcon: {
    color: 'var(--primary-600)',
  },
  promptTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--neutral-900)',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--error)',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    marginBottom: '8px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '16px',
    paddingRight: '50px',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-lg)',
    fontSize: '16px',
    lineHeight: 1.5,
    resize: 'none',
    minHeight: '50px',
    maxHeight: '300px',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: 'var(--neutral-50)',
    fontFamily: 'var(--font-family)',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  sendButton: {
    position: 'absolute',
    right: '12px',
    bottom: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow-sm)',
  },
  examples: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--neutral-200)',
    boxShadow: 'var(--shadow-sm)',
  },
  examplesTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'var(--neutral-600)',
    marginBottom: '12px',
    marginTop: 0,
  },
  exampleCards: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  exampleCard: {
    padding: '12px 16px',
    backgroundColor: 'var(--neutral-50)',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    color: 'var(--neutral-700)',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    fontFamily: 'var(--font-family)',
  }
};

export default AssignmentForm;