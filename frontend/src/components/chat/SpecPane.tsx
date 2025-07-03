import ReactMarkdown from 'react-markdown'
import { useIdeaSession } from '../../stores/ideaSession'
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ChatBubbleLeftIcon, 
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  XMarkIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import type { Components } from 'react-markdown'

const REQUIRED_SECTIONS = [
  'Vision & Outcome',
  'Core Features',
  'Tech Stack'
]

// Extensions and Open Questions are optional
const ALL_SECTIONS = [...REQUIRED_SECTIONS, 'Extensions', 'Open Questions']

export const SpecPane = () => {
  const { 
    specMarkdown, 
    isLoading, 
    updatedSections, 
    setInput,
    currentSession,
    // Version control
    specVersions,
    currentVersionIndex,
    isViewingHistory,
    loadSpecVersions,
    navigateToVersion,
    restoreVersion,
    // Manual editing
    isEditing,
    editContent,
    startEditing,
    cancelEditing,
    saveEdit,
    setEditContent
  } = useIdeaSession()
  
  const [highlightedSections, setHighlightedSections] = useState<string[]>([])
  const [sectionStatus, setSectionStatus] = useState<Record<string, boolean>>({})
  const [saveDescription, setSaveDescription] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  
  // Load versions when session changes
  useEffect(() => {
    if (currentSession?.id) {
      loadSpecVersions()
    }
  }, [currentSession?.id, loadSpecVersions])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          navigateToVersion('prev')
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          navigateToVersion('next')
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateToVersion])
  
  // Handle section highlighting
  useEffect(() => {
    if (updatedSections?.length) {
      setHighlightedSections(updatedSections)
      const timer = setTimeout(() => {
        setHighlightedSections([])
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [updatedSections])

  // Check section completeness
  useEffect(() => {
    if (!specMarkdown) return
    
    const status: Record<string, boolean> = {}
    ALL_SECTIONS.forEach(section => {
      const sectionRegex = new RegExp(`## ${section}\\n([^#]+)`, 'i')
      const match = specMarkdown.match(sectionRegex)
      // For Open Questions, consider it complete if it exists and has content
      if (section === 'Open Questions' || section === 'Extensions') {
        status[section] = true // Always mark as complete since it's optional
      } else {
        // Check if section exists and has meaningful content (not just _TODO or whitespace)
        const content = match?.[1]?.trim() || ''
        status[section] = !!(content && 
                           !content.includes('_TODO') && 
                           content !== '' &&
                           !/^\s*$/.test(content))
      }
    })
    setSectionStatus(status)
  }, [specMarkdown])

  // Handle adding text to chat input
  const appendToChat = (text: string) => {
    setInput(currentInput => {
      // If there's existing input, add a newline
      const prefix = currentInput ? currentInput + '\n' : ''
      return prefix + text
    })
  }

  // Handle AI suggestion for a section
  const requestAiSuggestion = (sectionName: string) => {
    appendToChat(`${sectionName}: AI Suggest`)
  }

  // Handle version restoration
  const handleRestoreVersion = async () => {
    if (currentVersionIndex >= 0 && specVersions[currentVersionIndex]) {
      const version = specVersions[currentVersionIndex]
      await restoreVersion(version.id)
    }
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      if (saveDescription.trim()) {
        await saveEdit(saveDescription)
      } else {
        await saveEdit()
      }
      // Always close dialog and reset state after successful save
      setSaveDescription('')
      setShowSaveDialog(false)
    } catch (error) {
      // Error is handled by the store, but keep dialog open for retry
      console.error('Save failed:', error)
    }
  }

  // Get current version info
  const getCurrentVersionInfo = () => {
    // With the corrected approach: SpecChange entries represent actual versions
    // If there are N SpecChange entries, there are N versions total
    const totalVersions = Math.max(1, specVersions.length) // At least 1 version
    
    if (isViewingHistory && currentVersionIndex >= 0) {
      // When viewing history: newer versions have lower indices
      // Index 0 = newest version, Index N-1 = oldest version  
      const versionNumber = specVersions.length - currentVersionIndex
      return {
        current: versionNumber,
        total: totalVersions,
        isHistorical: true
      }
    }
    
    // When viewing current (live) version
    return {
      current: totalVersions, // Current version is the latest
      total: totalVersions,
      isHistorical: false
    }
  }

  const versionInfo = getCurrentVersionInfo()

  // Custom markdown renderer for section highlighting and open questions
  const MarkdownComponents: Components = {
    h2: ({ children, ...props }) => {
      const sectionName = children?.toString() || ''
      const isHighlighted = highlightedSections.includes(sectionName)
      const isRequired = REQUIRED_SECTIONS.includes(sectionName)
      const isComplete = sectionStatus[sectionName]
      
      return (
        <div className="section-header">
          <h2 
            {...props} 
            className={`flex items-center gap-2 ${
              isHighlighted ? 'animate-highlight' : ''
            } ${
              isRequired && !isComplete ? 'section-incomplete' : ''
            } ${
              isRequired && isComplete ? 'section-complete' : ''
            }`}
          >
            {children}
            {isRequired && (
              isComplete ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-500" />
              )
            )}
          </h2>
          {(isRequired && !isComplete) && (
            <button
              onClick={() => requestAiSuggestion(sectionName)}
              className="ai-suggest-btn"
              title="Get AI suggestion for this section"
            >
              <SparklesIcon className="w-4 h-4 inline-block mr-1" />
              AI Suggest
            </button>
          )}
        </div>
      )
    },
    li: ({ children, ...props }) => {
      // Only add interaction to open questions section
      const text = children?.toString() || ''
      const isOpenQuestion = specMarkdown?.includes('## Open Questions\n') && 
                           specMarkdown?.indexOf(text) > specMarkdown?.indexOf('## Open Questions')
      
      if (isOpenQuestion) {
        return (
          <div className="open-question">
            <li {...props}>{children}</li>
            <div className="flex gap-2">
              <button
                onClick={() => appendToChat(text)}
                title="Add this question to chat"
                className="reply-btn"
              >
                <ChatBubbleLeftIcon className="w-4 h-4 inline-block mr-1" />
                Reply
              </button>
              <button
                onClick={() => requestAiSuggestion(text)}
                title="Get AI suggestion for this question"
                className="ai-suggest-btn"
              >
                <SparklesIcon className="w-4 h-4 inline-block mr-1" />
                AI Suggest
              </button>
            </div>
          </div>
        )
      }
      
      return <li {...props}>{children}</li>
    }
  }

  const allRequiredComplete = REQUIRED_SECTIONS.every(section => sectionStatus[section])

  return (
    <div className="w-1/2 h-full overflow-hidden bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 relative flex flex-col">
      {/* Header with Version Control and Edit Toggle */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          {/* Version Navigation */}
          <div className="version-navigator">
            <button
              onClick={() => navigateToVersion('prev')}
              disabled={isLoading || 
                       (currentVersionIndex === specVersions.length - 1) || // Already at oldest version
                       (specVersions.length === 0)} // No versions to navigate
              className="spec-action-btn"
              title="Previous version (Ctrl+↑)"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </button>
            <span className="version-indicator">
              Version {versionInfo.current} of {versionInfo.total}
              {versionInfo.isHistorical && (
                <span className="version-historical ml-2">
                  (Historical)
                </span>
              )}
            </span>
            <button
              onClick={() => navigateToVersion('next')}
              disabled={isLoading || 
                       currentVersionIndex <= -1 || // Already at current/newest version
                       (specVersions.length === 0)} // No versions to navigate  
              className="spec-action-btn"
              title="Next version (Ctrl+↓)"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Restore Version Button */}
            {isViewingHistory && (
              <button
                onClick={handleRestoreVersion}
                disabled={isLoading}
                className="spec-action-btn restore"
                title="Restore this version"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                Restore
              </button>
            )}
            
            {/* Edit Toggle */}
            {!isViewingHistory && (
              <button
                onClick={isEditing ? () => setShowSaveDialog(true) : startEditing}
                disabled={isLoading}
                className={`spec-action-btn ${isEditing ? 'primary' : ''}`}
                title={isEditing ? "Save changes" : "Edit specification"}
              >
                {isEditing ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : (
                  <PencilIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* Cancel Edit */}
            {isEditing && (
              <button
                onClick={cancelEditing}
                disabled={isLoading}
                className="spec-action-btn"
                title="Cancel editing"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-primary-500">
            <ArrowPathIcon className="w-6 h-6 animate-spin" />
            <span className="text-white">Updating specification...</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isEditing ? (
          /* Edit Mode */
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="edit-textarea w-full h-full p-4 rounded-lg resize-none focus:outline-none"
            placeholder="Enter your specification in Markdown format..."
          />
        ) : (
          /* View Mode */
          <div className="prose max-w-none">
            {specMarkdown ? (
              <ReactMarkdown components={MarkdownComponents}>{specMarkdown}</ReactMarkdown>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic">
                Start describing your project idea to generate a technical specification.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 pt-4 border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <button 
          disabled={!allRequiredComplete || isLoading}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generate Flowchart
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {!allRequiredComplete && specMarkdown && 
            "Complete all required sections to generate a flowchart"}
        </p>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog">
          <div className="save-dialog-content">
            <h3>Save Changes</h3>
            <textarea
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Describe your changes (optional)..."
            />
            <div className="save-dialog-buttons">
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="save-button"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                disabled={isLoading}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 