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
          
          <div style={styles.buttonGroup}>
            <button onClick={onToggleComplete} style={styles.secondaryButton}>
              {nodeData.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button onClick={onOpenChat} style={styles.chatButton}>
              <FiMessageSquare size={16} />
              Chat
            </button>
          </div>

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

          <button onClick={onDelete} style={styles.dangerButton}>
            Delete Step
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
  actions: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  primaryButton: {
    padding: '12px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb'
    }
  },
  secondaryButton: {
    padding: '10px 16px',
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
  },
  chatButton: {
    padding: '10px 16px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#bae6fd'
    }
  },
  dangerButton: {
    padding: '12px 20px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#fecaca'
    }
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }
};

export default NodeEditorModal;