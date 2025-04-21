import React, { useState } from 'react';
import { createAssignment } from '../services/api';
import { FiFileText } from 'react-icons/fi';

function AssignmentForm({ onAssignmentCreated }) {
  const [assignmentInput, setAssignmentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignmentInput.trim()) {
      setError('Please enter project details');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createAssignment(assignmentInput);
      setAssignmentInput('');
      if (onAssignmentCreated) onAssignmentCreated(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FiFileText size={24} style={styles.icon} />
        <h2 style={styles.title}>New Project Setup</h2>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Project Details</label>
          <textarea
            value={assignmentInput}
            onChange={(e) => setAssignmentInput(e.target.value)}
            style={styles.textarea}
            placeholder="Example: Develop a REST API with Node.js and MongoDB..."
            rows={6}
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          style={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Start Project'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
    maxWidth: '600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  icon: {
    color: '#3b82f6'
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: '20px'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '24px',
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
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500
  },
  textarea: {
    width: '100%',
    padding: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
    resize: 'vertical',
    minHeight: '120px',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
    }
  },
  submitButton: {
    padding: '14px 24px',
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
  }
};

export default AssignmentForm;