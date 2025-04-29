import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiMessageSquare } from 'react-icons/fi';

const NodeEditorModal = ({ 
  isOpen, 
  onClose, 
  onDelete, 
  onToggleComplete, 
  onAddAfter,
  onAddNewStep,
  onAddSubstep,
  onOpenChat,
  nodeData,
  onUpdateContent
}) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    // Directly access the content from nodeData
    if (nodeData?.content) {
      setContent(nodeData.content);
    }
  }, [nodeData]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Edit Step</h3>
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
            placeholder="Edit step description..."
          />
        </div>

        <div style={styles.actions}>
        <button 
          onClick={() => onUpdateContent(content)}
          style={styles.primaryButton}
        >
          <FiCheck size={16} />
          Save Changes
        </button>
        
        <div style={styles.divider}></div>
        
        <div style={styles.buttonGroup}>
          <button onClick={onToggleComplete} style={styles.secondaryButton}>
            {nodeData.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button onClick={onOpenChat} style={styles.chatButton}>
            <FiMessageSquare size={16} />
            Chat
          </button>
        </div>

        <div style={styles.divider}></div>
        
        <div style={styles.buttonGroup}>
          {nodeData.parent_id === null ? (
            <>
              <button onClick={onAddAfter} style={styles.secondaryButton}>Add After</button>
              <button onClick={onAddNewStep} style={styles.secondaryButton}>New Main Step</button>
            </>
          ) : (
            <>
              <button onClick={onAddAfter} style={styles.secondaryButton}>Add After</button>
              <button onClick={onAddSubstep} style={styles.secondaryButton}>Add Substep</button>
            </>
          )}
        </div>

        <div style={styles.divider}></div>
        
        <button onClick={onDelete} style={styles.dangerButton}>
          Delete Step
        </button>
      </div>
      </div>
    </div>
  );
};

// Updated styles for NodeEditorModal.jsx
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
    width: '420px',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideInUp 0.3s ease',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid var(--neutral-200)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--neutral-50)'
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
    backgroundColor: 'var(--neutral-50)',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  actions: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderTop: '1px solid var(--neutral-200)'
  },
  primaryButton: {
    padding: '12px 20px',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)'
  },
  secondaryButton: {
    padding: '10px 16px',
    backgroundColor: 'white',
    color: 'var(--neutral-600)',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)'
  },
  chatButton: {
    padding: '10px 16px',
    backgroundColor: 'var(--primary-100)',
    color: 'var(--primary-700)',
    border: '1px solid var(--primary-200)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)'
  },
  dangerButton: {
    padding: '12px 20px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--error)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--neutral-200)',
    margin: '4px 0'
  }
};

export default NodeEditorModal;