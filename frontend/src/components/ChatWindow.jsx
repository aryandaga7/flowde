// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { getAssignmentChat, getNodeChat, postChatMessage } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiX, FiZoomIn } from 'react-icons/fi'; // Added FiZoomIn
import axios from 'axios';

const ChatWindow = ({ assignmentId, stepId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deepDiveActive, setDeepDiveActive] = useState(false);
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const messagesEndRef = useRef(null);


  // Auto-scroll to bottom on new messages
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const processMessages = (exchanges) => {
    return exchanges.flatMap(exchange => [
      ...(exchange.user_message ? [{
        id: `${exchange.id}-user`,
        type: 'user',
        content: exchange.user_message,
        timestamp: exchange.timestamp
      }] : []),
      ...(exchange.bot_response ? [{
        id: `${exchange.id}-bot`,
        type: 'bot',
        content: exchange.bot_response,
        timestamp: exchange.timestamp
      }] : [])
    ]);
  };

  const fetchMessages = async () => {
    try {
      const data = stepId 
        ? await getNodeChat(stepId)
        : await getAssignmentChat(assignmentId);
      setMessages(processMessages(data));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [assignmentId, stepId]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const tempId = Date.now();
    try {
      setIsSending(true);
      // Optimistic update for user message
      setMessages(prev => [
        ...prev,
        { id: `${tempId}-user`, type: 'user', content: input, timestamp: new Date() }
      ]);

      const response = await postChatMessage({
        assignment_id: assignmentId,
        step_id: stepId,
        user_message: input
      });

      // Replace temporary message with server response
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== `${tempId}-user`),
        { id: `${response.id}-user`, type: 'user', content: input, timestamp: response.timestamp },
        { id: `${response.id}-bot`, type: 'bot', content: response.bot_response, timestamp: response.timestamp }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== `${tempId}-user`));
    } finally {
      setInput('');
      setIsSending(false);
    }
  };
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);

  // Add Deep Dive handler
  const handleDeepDive = async () => {
    if (!stepId || isDeepDiving) return;
    
    try {
        setIsDeepDiving(true);
        
        // Add loading message
        setMessages(prev => [...prev, {
            id: `deepdive-loading-${Date.now()}`,
            type: 'bot',
            content: '**Deep Dive Initiated**\nAnalyzing this step...',
            timestamp: new Date()
        }]);

        // Call the dedicated deep dive endpoint
        const response = await axios.post(
            `http://localhost:8000/chat/deepdive/${stepId}`,
            { question: "Break down this step into sub-steps" },  // Default question or make this configurable
            { headers: getAuthHeaders() }
        );

        // Update messages with the actual response
        setMessages(prev => [
            ...prev.filter(msg => !msg.id.startsWith('deepdive-loading')),
            {
                id: `deepdive-${Date.now()}`,
                type: 'bot',
                content: "Deep dive completed! New sub-steps added." + response.data.breakdown_steps.map(s => `• ${s.content}`.join('\n')),
                timestamp: new Date()
            }
        ]);

        if (onDeepDiveSuccess) {
            onDeepDiveSuccess();
        }
    } catch (error) {
        console.error("Deep dive failed:", error);
        setMessages(prev => [
            ...prev.filter(msg => !msg.id.startsWith('deepdive-loading')),
            {
                id: `deepdive-error-${Date.now()}`,
                type: 'bot',
                content: "❌ Deep dive failed. Please try again."+ (error.response?.data?.detail || 'Unknown error'),
                timestamp: new Date()
            }
        ]);
    } finally {
        setIsDeepDiving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.chatContainer}>
        <div style={styles.header}>
          <h3 style={styles.title}>{stepId ? "Node Chat" : "Assignment Chat"}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <div style={styles.messagesContainer}>
          {messages.map(message => (
            <div 
              key={message.id}
              style={{
                ...styles.messageRow,
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={message.type === 'user' ? styles.userBubble : styles.botBubble}>
                {message.type === 'bot' ? (
                  <ReactMarkdown children={message.content} />
                ) : message.content}
                <div style={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
        {stepId && (
          <div style={styles.deepDiveHeader}>
            <button 
              onClick={handleDeepDive}
              style={{
                ...styles.deepDiveButton,
                backgroundColor: deepDiveActive ? '#3b82f6' : '#f1f5f9',
                color: deepDiveActive ? 'white' : '#64748b'
              }}
              disabled={isDeepDiving}
            >
              {isDeepDiving ? (
                <FiLoader className="spin" style={{ marginRight: 8 }} />
              ) : (
                <FiZoomIn style={{ marginRight: 8 }} />
              )}
              Deep Dive
            </button>
          </div>
        )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            style={styles.input}
            disabled={isSending}
          />
          <button 
            onClick={handleSend} 
            style={styles.sendButton}
            disabled={isSending}
          >
            <FiSend size={18} />
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
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-start',
    backdropFilter: 'blur(2px)'
  },
  chatContainer: {
    width: '400px',
    height: '100vh',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    borderRight: '1px solid #f0f0f0'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#2d3748'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#718096',
    padding: '4px',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#f7fafc'
    }
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    backgroundColor: '#f8fafc'
  },
  messageRow: {
    display: 'flex',
    marginBottom: '16px',
    transition: 'all 0.2s ease'
  },
  botBubble: {
    background: '#ffffff',
    color: '#2d3748',
    borderRadius: '12px',
    padding: '12px 16px',
    maxWidth: '80%',
    fontSize: '14px',
    lineHeight: 1.5,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  userBubble: {
    background: '#3b82f6',
    color: 'white',
    borderRadius: '12px',
    padding: '12px 16px',
    maxWidth: '80%',
    fontSize: '14px',
    lineHeight: 1.5,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  timestamp: {
    fontSize: '12px',
    color: '#718096',
    marginTop: '8px',
    opacity: 0.8
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #eee',
    background: '#ffffff'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59,130,246,0.1)'
    }
  },
  sendButton: {
    padding: '12px 14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2563eb'
    },
    ':disabled': {
      backgroundColor: '#93c5fd',
      cursor: 'not-allowed'
    }
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #eee',
    background: '#ffffff',
    alignItems: 'center'
  },
  deepDiveHeader: {
    padding: '12px 20px',
    borderBottom: '1px solid #eee',
    background: '#ffffff'
  },
  deepDiveButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':disabled': {
      opacity: 0.7,
      cursor: 'not-allowed'
    }
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
  },
  spin: {
    animation: '$spin 1s linear infinite'
  }
};

export default ChatWindow;