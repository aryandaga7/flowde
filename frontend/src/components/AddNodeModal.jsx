import React, { useState, useEffect } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const AddNodeModal = ({ isOpen, onClose, onSubmit, initialPosition }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) setContent('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Create New Step</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>
        
        <div style={styles.content}>
          <label style={styles.label}>Step Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
            placeholder="Enter step description..."
            autoFocus
          />
          <div style={styles.positionInfo}>
            <FiPlus size={14} />
            <span>Will be placed at ({Math.round(initialPosition.x)}, {Math.round(initialPosition.y)})</span>
          </div>
        </div>

        <div style={styles.footer}>
          <button 
            onClick={() => onSubmit({ content, position: initialPosition })}
            style={styles.primaryButton}
          >
            Create Step
          </button>
          <button onClick={onClose} style={styles.secondaryButton}>
            Cancel
          </button>
        </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '400px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #f0f4f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
    fontWeight: 600
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#f8fafc'
    }
  },
  content: {
    padding: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#64748b',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    resize: 'vertical',
    ':focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
    }
  },
  positionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    fontSize: '12px'
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #f0f4f9',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb'
    }
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f4f9'
    }
  }
};

export default AddNodeModal;