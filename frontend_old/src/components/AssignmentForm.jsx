// Updated AssignmentForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createAssignment, createAssignmentWithFiles } from '../services/api';
import { FiFileText, FiSend, FiArrowRight, FiLoader, FiFile, FiCode, FiBook, FiAlignLeft } from 'react-icons/fi';

function AssignmentForm({ onAssignmentCreated }) {
  const [assignmentInput, setAssignmentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const [pdfs, setPdfs] = useState([]);
  const [pdfError, setPdfError] = useState(null);
  const [pdfSuccess, setPdfSuccess] = useState(null);
  const [isUsingPdfOnly, setIsUsingPdfOnly] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10;
  const ALLOWED_FILE_TYPES = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'text/plain': 'TXT',
    'text/markdown': 'MD',
    'text/javascript': 'JS',
    'text/x-python': 'Python',
    'text/x-java': 'Java',
    'text/html': 'HTML',
    'text/css': 'CSS'
  };

  const getFileIcon = (file) => {
    if (file.type.includes('pdf')) {
      return <FiFileText size={16} style={{ ...styles.fileIcon, color: 'var(--error)' }} />;
    } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
      return <FiBook size={16} style={{ ...styles.fileIcon, color: 'var(--primary-600)' }} />;
    } else if (file.type.includes('text') || 
               file.name.endsWith('.txt') || 
               file.name.endsWith('.md')) {
      return <FiAlignLeft size={16} style={{ ...styles.fileIcon, color: 'var(--neutral-600)' }} />;
    } else if (file.name.endsWith('.py') || 
               file.name.endsWith('.js') || 
               file.name.endsWith('.java') || 
               file.name.endsWith('.html') || 
               file.name.endsWith('.css')) {
      return <FiCode size={16} style={{ ...styles.fileIcon, color: 'var(--accent-500)' }} />;
    }
    return <FiFile size={16} style={styles.fileIcon} />;
  };

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

  useEffect(() => {
    window.updateUploadProgress = (progress) => {
      setUploadProgress(progress);
    };
    
    return () => {
      window.updateUploadProgress = null;
    };
  }, []);

  // Add this function to handle PDF uploads
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setPdfError(null);
    setPdfSuccess(null);
    
    // Check if user is trying to upload too many files
    if (pdfs.length + files.length > MAX_FILES) {
      setPdfError(`You can only upload up to ${MAX_FILES} files`);
      return;
    }
    
    // Check file types and sizes
    const validFiles = files.filter(file => {
      // Check file type
      if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type) && 
          !file.name.endsWith('.py') && 
          !file.name.endsWith('.java') && 
          !file.name.endsWith('.js')) {
        setPdfError('Only PDF, DOCX, TXT, MD, and code files are allowed');
        return false;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
        setPdfError(`File size should not exceed ${MAX_FILE_SIZE}MB`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      const newFiles = [...pdfs, ...validFiles];
      setPdfs(newFiles);
      setPdfSuccess(`Successfully added ${validFiles.length} file(s). Total: ${newFiles.length}`);
    }
  };

  // Modify the handleSubmit function to include PDF files
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignmentInput.trim() && pdfs.length === 0) {
      setError('Please enter project details or upload PDF files');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create FormData to send both text and files
      const formData = new FormData();
      
      // Always add assignment_input field
      formData.append('assignment_input', assignmentInput.trim() ? assignmentInput : 'Create assignment from uploaded PDFs');
      
      // Add pdf_only flag if there's no text input
      if (!assignmentInput.trim() && pdfs.length > 0) {
        formData.append('pdf_only', 'true');
      }
      
      // Append each PDF file with a consistent field name
      if (pdfs.length > 0) {
        // Use the same field name 'files' for all files - this is crucial
        pdfs.forEach(pdf => {
          formData.append('files', pdf);
        });
        
        console.log("Files being sent:");
        pdfs.forEach(pdf => {
          console.log(`- ${pdf.name} (${pdf.size} bytes, type: ${pdf.type})`);
        });
      } else {
        console.log("No files to send");
      }
      
      // Make API call with FormData
      const result = await createAssignmentWithFiles(formData);
      
      // Clear input and form data
      setAssignmentInput('');
      setPdfs([]);
      setPdfSuccess(null);
      localStorage.removeItem('newAssignmentFormData');
      
      // Handle successful response
      if (!result || !result.assignment_id) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('appState', 'viewing_assignment');
      localStorage.setItem('currentAssignmentId', result.assignment_id.toString());
      
      if (onAssignmentCreated) {
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
  const totalFileSize = pdfs.reduce((total, file) => total + file.size, 0);

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
            {/* PDF Upload Section */}
            <div style={styles.fileUploadContainer}>
              <label htmlFor="pdf-upload" style={styles.fileUploadLabel}>
                <div style={styles.uploadIcon}>
                  <FiFileText size={20} />
                </div>
                <span>Upload Assignment Files{pdfs.length > 0 ? ` (${pdfs.length}/${MAX_FILES})` : ''}</span>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,.docx,.txt,.md,.py,.js,.java,.html,.css"
                multiple
                onChange={handleFileUpload}
                style={styles.fileInput}
                disabled={isLoading || pdfs.length >= MAX_FILES}
              />

              
              {pdfError && <div style={styles.pdfError}>{pdfError}</div>}
              {pdfSuccess && <div style={styles.pdfSuccess}>{pdfSuccess}</div>}
              
              {pdfs.length > 0 && (
                <div style={styles.uploadedFiles}>
                  {pdfs.map((file, index) => (
                    <div key={index} style={styles.fileItem}>
                      {getFileIcon(file)}
                      <span style={styles.fileName}>{file.name}</span>
                      <span style={styles.fileSize}>
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => {
                          setPdfs(pdfs.filter((_, i) => i !== index));
                          setPdfSuccess(`${pdfs.length - 1} file(s) remaining`);
                        }}
                        disabled={isLoading}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {pdfs.length > 0 && (
                <div style={styles.fileStats}>
                  <div style={styles.fileStat}>
                    <span>Files:</span>
                    <div style={styles.fileStatBar}>
                      <div 
                        style={{
                          ...styles.fileStatFill,
                          width: `${(pdfs.length / MAX_FILES) * 100}%`,
                          backgroundColor: pdfs.length > MAX_FILES * 0.8 ? 'var(--warning, #f59e0b)' : 'var(--primary-500, #3b82f6)'
                        }}
                      />
                    </div>
                    <span>{pdfs.length}/{MAX_FILES}</span>
                  </div>
                  
                  <div style={styles.fileStat}>
                    <span>Size:</span>
                    <div style={styles.fileStatBar}>
                      <div 
                        style={{
                          ...styles.fileStatFill,
                          width: `${Math.min((totalFileSize / (MAX_FILE_SIZE * 1024 * 1024)) * 100, 100)}%`,
                          backgroundColor: totalFileSize > (MAX_FILE_SIZE * 1024 * 1024 * 0.8) ? 'var(--warning, #f59e0b)' : 'var(--primary-500, #3b82f6)'
                        }}
                      />
                    </div>
                    <span>{(totalFileSize / (1024 * 1024)).toFixed(2)}MB/{MAX_FILE_SIZE}MB</span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={assignmentInput}
                onChange={(e) => setAssignmentInput(e.target.value)}
                style={styles.textarea}
                placeholder="Describe your assignment or project in detail, or just upload PDFs above."
                rows={1}
                disabled={isLoading}
              />
              
              <button 
                type="submit" 
                style={{
                  ...styles.sendButton,
                  opacity: isLoading || (!assignmentInput.trim() && pdfs.length === 0) ? 0.6 : 1
                }}
                disabled={isLoading || (!assignmentInput.trim() && pdfs.length === 0)}
              >
                {isLoading ? (
                  <FiLoader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <FiArrowRight size={20} />
                )}
              </button>
            </div>
            {isLoading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressText}>Uploading files and creating assignment...</div>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${uploadProgress}%`
                    }}
                  />
                </div>
                <div style={styles.progressPercentage}>{uploadProgress}%</div>
              </div>
            )}
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
  fileUploadContainer: {
    marginTop: '16px',
    marginBottom: '16px',
  },
  fileUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'var(--neutral-50)',
    border: '1px dashed var(--neutral-300)',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'var(--neutral-700)',
    fontWeight: '500',
  },
  uploadIcon: {
    color: 'var(--primary-600)',
  },
  fileInput: {
    display: 'none',
  },
  pdfError: {
    color: 'var(--error)',
    fontSize: '14px',
    marginTop: '8px',
  },
  uploadedFiles: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--neutral-200)',
  },
  fileIcon: {
    color: 'var(--primary-600)',
  },
  fileName: {
    flex: 1,
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--neutral-500)',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    borderRadius: '50%',
    height: '24px',
    width: '24px',
  },
  fileSize: {
    fontSize: '12px',
    color: 'var(--neutral-500)',
    marginLeft: 'auto',
    marginRight: '8px',
  },
  fileStats: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fileStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  fileStatBar: {
    flex: 1,
    height: '8px',
    backgroundColor: 'var(--neutral-200)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fileStatFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressContainer: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--neutral-200)',
  },
  progressText: {
    fontSize: '14px',
    color: 'var(--neutral-700)',
    marginBottom: '8px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: 'var(--neutral-200)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--primary-500)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressPercentage: {
    fontSize: '12px',
    color: 'var(--neutral-500)',
    textAlign: 'right',
  },

  pdfSuccess: {
    color: 'var(--primary-600)',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '14px',
    marginTop: '8px',
    border: '1px solid rgba(52, 152, 219, 0.2)',
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