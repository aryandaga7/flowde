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

// Updated styles for AddNodeModal.jsx
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
    backdropFilter: 'blur(2px)',
    animation: 'fadeIn 0.2s ease'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    width: '400px',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideInUp 0.3s ease',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid var(--neutral-200)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: 'var(--neutral-900)',
    fontWeight: 600,
    fontFamily: 'var(--font-family)'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--neutral-500)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  content: {
    padding: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: 'var(--neutral-500)',
    fontSize: '14px',
    fontWeight: 500
  },
  textarea: {
    width: '100%',
    height: '120px',
    padding: '12px',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    marginBottom: '16px',
    resize: 'vertical',
    fontFamily: 'var(--font-family)',
    transition: 'all 0.2s ease',
    backgroundColor: 'var(--neutral-50)'
  },
  positionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--neutral-400)',
    fontSize: '12px',
    padding: '8px 12px',
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--neutral-200)'
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid var(--neutral-200)',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    backgroundColor: 'var(--neutral-50)'
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)'
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: 'var(--neutral-600)',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)'
  }
};

export default AddNodeModal;