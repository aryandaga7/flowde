// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { getAssignmentChat, getNodeChat, postChatMessage } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiSend, FiX, FiZoomIn, FiLoader, FiCopy, FiCheck } from 'react-icons/fi';
import axios from 'axios';

const ChatWindow = ({ assignmentId, stepId, onClose, onDeepDiveSuccess, nodeData }) => {
  
  const [input, setInput] = useState('');
  const [deepDiveActive, setDeepDiveActive] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  // Define query keys
  const chatQueryKey = useMemo(() => 
    stepId ? ['nodeChat', stepId] : ['assignmentChat', assignmentId], 
    [assignmentId, stepId]
  );

  // Use React Query to fetch messages
  const { 
    data: chatData,
    isLoading: isLoadingChat,
    isError: isChatError,
    error: chatError 
  } = useQuery({
    queryKey: chatQueryKey,
    queryFn: async () => {
      if (stepId) {
        return await getNodeChat(stepId);
      } else {
        return await getAssignmentChat(assignmentId);
      }
    },
    enabled: !!(assignmentId || stepId),
  });

  // Process messages into a consistent format
  const messages = useMemo(() => {
    if (!chatData) return [];
    return chatData.flatMap(exchange => [
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
  }, [chatData]);

  // Create mutation for sending messages
  const { mutate: sendMessage, isLoading: isSending } = useMutation({
    mutationFn: (message) => postChatMessage({
      assignment_id: assignmentId,
      step_id: stepId,
      user_message: message
    }),
    onMutate: async (newMessage) => {
      // Optimistic update
      const tempId = Date.now();
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatQueryKey });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(chatQueryKey);
      
      // Optimistically update to the new value
      if (previousMessages) {
        // Create a synthetic exchange to match API format
        const syntheticExchange = {
          id: tempId,
          user_message: newMessage,
          timestamp: new Date()
        };
        
        queryClient.setQueryData(chatQueryKey, [...previousMessages, syntheticExchange]);
      }
      
      return { previousMessages, tempId };
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic update and add real data
      queryClient.setQueryData(chatQueryKey, (old) => 
        old ? old.filter(item => item.id !== context.tempId).concat(data) : [data]
      );
    },
    onError: (err, variables, context) => {
      // Revert back to previous state if there's an error
      if (context?.previousMessages) {
        queryClient.setQueryData(chatQueryKey, context.previousMessages);
      }
      console.error("Error sending message:", err);
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: chatQueryKey });
    }
  });

  // Get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Separate deep dive mutation
  const { mutate: performDeepDive, isLoading: isDeepDiveLoading } = useMutation({
    mutationFn: async (question) => {
      setIsDeepDiving(true);
      const response = await axios.post(
        `http://localhost:8000/chat/deepdive/${stepId}`,
        { question },
        { headers: getAuthHeaders() }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Add success message to chat
      queryClient.setQueryData(chatQueryKey, (old) => {
        const deepDiveExchange = {
          id: `deepdive-${Date.now()}`,
          bot_response: "Deep dive completed! New sub-steps added.\n" + 
            data.breakdown_steps.map(s => `• ${s.content}`).join('\n'),
          timestamp: new Date()
        };
        return old ? [...old, deepDiveExchange] : [deepDiveExchange];
      });
      
      // Call success callback to refresh flowchart and auto-trigger layout reset
      if (onDeepDiveSuccess) {
        onDeepDiveSuccess();
      }
      setIsDeepDiving(false);
    },
    onError: (error) => {
      // Add error message to chat
      queryClient.setQueryData(chatQueryKey, (old) => {
        const errorExchange = {
          id: `deepdive-error-${Date.now()}`,
          bot_response: "❌ Deep dive failed. Please try again." + 
            (error.response?.data?.detail || 'Unknown error'),
          timestamp: new Date()
        };
        return old ? [...old, errorExchange] : [errorExchange];
      });
      console.error("Deep dive failed:", error);
      setIsDeepDiving(false);
    },
    onMutate: () => {
      // Add loading message
      queryClient.setQueryData(chatQueryKey, (old) => {
        const loadingExchange = {
          id: `deepdive-loading-${Date.now()}`,
          bot_response: '**Deep Dive Initiated**\nAnalyzing this step...',
          timestamp: new Date()
        };
        return old ? [...old, loadingExchange] : [loadingExchange];
      });
    }
  });

  // Auto-scroll to bottom on new messages
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // When the chat is opened, save which chat is active to localStorage
    if (stepId) {
      localStorage.setItem('activeChat', JSON.stringify({
        type: 'node',
        assignmentId,
        stepId
      }));
    } else {
      localStorage.setItem('activeChat', JSON.stringify({
        type: 'assignment',
        assignmentId
      }));
    }
    
    // Clean up function to run when chat is closed
    return () => {
      // Only clear if this is the active chat being closed
      const activeChat = JSON.parse(localStorage.getItem('activeChat') || '{}');
      if ((activeChat.type === 'node' && activeChat.stepId === stepId) ||
          (activeChat.type === 'assignment' && activeChat.assignmentId === assignmentId && !stepId)) {
        localStorage.removeItem('activeChat');
      }
    };
  }, [assignmentId, stepId]);

  // Debounced send handler to prevent rapid message sending
  const debouncedSendHandler = useMemo(() => 
    debounce((message) => {
      if (message.trim()) {
        sendMessage(message);
      }
    }, 300),
    [sendMessage]
  );

  // Handle send message
  const handleSend = useCallback(() => {
    if (!input.trim() || isSending || isDeepDiving) return;
    
    const message = input.trim();
    setInput(''); // Clear input immediately for better UX
    
    // If deep dive is active, use the deep dive API
    if (deepDiveActive && stepId) {
      performDeepDive(message);
      // Still show the user message in the chat
      debouncedSendHandler(message);
    } else {
      debouncedSendHandler(message);
    }
  }, [input, isSending, deepDiveActive, stepId, debouncedSendHandler, performDeepDive, isDeepDiving]);

  // Toggle deep dive mode
  const toggleDeepDive = useCallback(() => {
    setDeepDiveActive(prev => !prev);
  }, []);

  // Handle code block copying
  const handleCopyCode = useCallback((code, id) => {
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000); // Reset after 2 seconds
  }, []);

  // Auto-resize textarea
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  }, []);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (input === '' && inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input]);

  // Custom renderer for markdown code blocks
  const CodeBlock = useCallback(({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');
    const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;

    if (!inline && match) {
      return (
        <div style={styles.codeBlockContainer}>
          <div style={styles.codeBlockHeader}>
            <span style={styles.codeBlockLanguage}>{match[1]}</span>
            <CopyToClipboard text={code} onCopy={() => handleCopyCode(code, codeId)}>
              <button style={styles.copyButton}>
                {copiedCode === codeId ? <FiCheck size={14} /> : <FiCopy size={14} />}
                <span style={styles.copyText}>{copiedCode === codeId ? 'Copied!' : 'Copy'}</span>
              </button>
            </CopyToClipboard>
          </div>
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    } else if (!inline) {
      // For code blocks without specified language
      return (
        <div style={styles.codeBlockContainer}>
          <div style={styles.codeBlockHeader}>
            <span style={styles.codeBlockLanguage}>code</span>
            <CopyToClipboard text={code} onCopy={() => handleCopyCode(code, codeId)}>
              <button style={styles.copyButton}>
                {copiedCode === codeId ? <FiCheck size={14} /> : <FiCopy size={14} />}
                <span style={styles.copyText}>{copiedCode === codeId ? 'Copied!' : 'Copy'}</span>
              </button>
            </CopyToClipboard>
          </div>
          <SyntaxHighlighter
            style={atomDark}
            language="text"
            PreTag="div"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    return <code className={className} {...props}>{children}</code>;
  }, [copiedCode, handleCopyCode]);

  return (
    <div style={styles.overlay}>
      <div style={styles.chatContainer}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h3 style={styles.title}>{stepId ? "Node Chat" : "Assignment Chat"}</h3>
          {stepId && nodeData && (
            <div style={styles.nodeContext}>
              <div style={styles.nodeContentLabel}>Current Node:</div>
              <div style={styles.nodeContentText}>{nodeData.content}</div>
              {nodeData.deadline && (
                <div style={styles.nodeDeadline}>
                  <FiCalendar size={12} style={{marginRight: '4px'}} />
                  Due: {new Date(nodeData.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={onClose} style={styles.closeButton}>
          <FiX size={20} />
        </button>
      </div>

        <div style={styles.messagesContainer}>
          {isLoadingChat && !messages.length ? (
            <div style={styles.loadingMessage}>Loading messages...</div>
          ) : isChatError ? (
            <div style={styles.errorMessage}>
              Error loading messages: {chatError?.message || 'Unknown error'}
            </div>
          ) : messages.length === 0 ? (
            <div style={styles.emptyMessage}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={message.type === 'user' ? styles.userBubble : styles.botBubble}>
                  {message.type === 'bot' ? (
                    <ReactMarkdown 
                      components={{ code: CodeBlock }}
                      children={message.content} 
                    />
                  ) : message.content}
                  <div style={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Deep Dive Toggle Button */}
        {stepId && (
          <div style={styles.deepDiveBar}>
            <button 
              onClick={toggleDeepDive}
              style={{
                ...styles.deepDiveToggle,
                backgroundColor: deepDiveActive ? '#3b82f6' : '#f1f5f9',
                color: deepDiveActive ? 'white' : '#64748b'
              }}
              disabled={isDeepDiving}
            >
              {isDeepDiving ? (
                <FiLoader style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              ) : (
                <FiZoomIn style={{ marginRight: 8 }} />
              )}
              Deep Dive {deepDiveActive ? 'ON' : 'OFF'}
            </button>
            {deepDiveActive && (
              <div style={styles.deepDiveInfo}>
                {isDeepDiving ? 
                  <div style={styles.deepDiveStatus}>Processing...</div> : 
                  <div style={styles.deepDiveHint}>Expand Step</div>
                }
              </div>
            )}
          </div>
        )}

        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={deepDiveActive ? "Ask a detailed question about this step..." : "Type your message..."}
            style={styles.input}
            disabled={isSending || isDeepDiving}
            rows={1}
          />
          
          <button 
            onClick={handleSend} 
            style={{
              ...styles.sendButton,
              opacity: (isSending || isDeepDiving || !input.trim()) ? 0.7 : 1
            }}
            disabled={isSending || isDeepDiving || !input.trim()}
          >
            {isSending ? (
              <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={18} />
            ) : (
              <FiSend size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Updated styles object for ChatWindow.jsx
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
    backdropFilter: 'blur(2px)',
    animation: 'fadeIn 0.3s ease'
  },
  chatContainer: {
    width: '50%',
    maxWidth: '700px',
    height: '100vh',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
    borderRight: '1px solid var(--neutral-200)',
    animation: 'slideInRight 0.3s ease'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--neutral-200)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'white'
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--neutral-800)'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--neutral-500)',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--neutral-100)'
    }
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    backgroundColor: 'var(--neutral-50)'
  },
  messageRow: {
    display: 'flex',
    marginBottom: '20px',
    transition: 'all 0.2s ease',
    animation: 'fadeIn 0.3s ease'
  },
  botBubble: {
    background: 'white',
    color: 'var(--neutral-800)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '16px',
    maxWidth: '85%',
    fontSize: '15px',
    lineHeight: 1.6,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--neutral-200)'
  },
  userBubble: {
    background: 'var(--primary-600)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    padding: '16px',
    maxWidth: '85%',
    fontSize: '15px',
    lineHeight: 1.6,
    boxShadow: 'var(--shadow-sm)'
  },
  timestamp: {
    fontSize: '12px',
    color: 'var(--neutral-500)',
    marginTop: '8px',
    opacity: 0.8
  },
  input: {
    flex: 1,
    padding: '16px 20px',
    border: '1px solid var(--neutral-200)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    resize: 'none',
    minHeight: '24px',
    maxHeight: '150px',
    overflow: 'auto',
    lineHeight: 1.5,
    fontFamily: 'var(--font-family)',
    '&:focus': {
      borderColor: 'var(--primary-400)',
      boxShadow: '0 0 0 2px var(--primary-100)'
    }
  },
  sendButton: {
    alignSelf: 'flex-end',
    padding: '12px 14px',
    backgroundColor: 'var(--primary-600)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--primary-700)'
    },
    '&:disabled': {
      backgroundColor: 'var(--primary-300)',
      cursor: 'not-allowed'
    }
  },
  inputArea: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    borderTop: '1px solid var(--neutral-200)',
    background: 'white',
    alignItems: 'flex-end'
  },
  deepDiveBar: {
    padding: '12px 20px',
    borderTop: '1px solid var(--neutral-200)',
    background: 'var(--neutral-50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  deepDiveToggle: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--neutral-200)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    gap: '8px'
  },
  deepDiveStatus: {
    color: 'var(--primary-600)',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  deepDiveInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  deepDiveHint: {
    color: 'var(--neutral-500)',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  loadingMessage: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--neutral-500)',
    fontSize: '14px'
  },
  errorMessage: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--error)',
    fontSize: '14px',
    background: '#FEE2E2',
    borderRadius: 'var(--border-radius-md)',
    margin: '16px'
  },
  emptyMessage: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--neutral-500)',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  nodeContext: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    border: '1px solid var(--neutral-200)',
    maxHeight: '80px',
    overflowY: 'auto',
  },
  nodeContentLabel: {
    fontWeight: 'bold',
    marginBottom: '4px',
    color: 'var(--neutral-500)',
    fontSize: '12px',
  },
  nodeContentText: {
    color: 'var(--neutral-900)',
    fontWeight: '500',
    wordBreak: 'break-word',
  },
  nodeDeadline: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--neutral-500)',
    marginTop: '4px',
  },
  codeBlockContainer: {
    margin: '16px 0',
    borderRadius: 'var(--border-radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--neutral-700)'
  },
  codeBlockHeader: {
    backgroundColor: 'var(--neutral-800)',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--neutral-700)'
  },
  codeBlockLanguage: {
    color: 'var(--neutral-400)',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase'
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--neutral-600)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--neutral-300)',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--neutral-700)'
    }
  },
  copyText: {
    fontSize: '12px'
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
  }
};

export default ChatWindow;