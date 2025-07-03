import { useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useIdeaSession } from '../stores/ideaSession'
import { SpecPane } from '../components/chat/SpecPane'
import { PersonaPromptBar } from '../components/chat/PersonaPromptBar'
import { ChangesSummary } from '../components/chat/ChangesSummary'
import { SkillLevelSelector } from '../components/chat/SkillLevelSelector'
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { ideaApi } from '../services/api'

export default function IdeaChat() {
  const { id: sessionId } = useParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    setCurrentSession,
    currentSession,
    setMessages,
    setSpecMarkdown,
    input,
    setInput,
    // Phase 1: Change communication
    lastChangesMade,
    skillLevel,
    setSkillLevel
  } = useIdeaSession()

  // Fetch session data if we have a sessionId
  const { data: sessionData } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionId ? ideaApi.getSession(sessionId) : null,
    enabled: !!sessionId
  })

  // Update current session when data changes
  useEffect(() => {
    if (sessionData) {
      setCurrentSession(sessionData)
      // Load messages and spec for this session
      ideaApi.getSessionMessages(sessionId!).then(data => {
        setMessages(data.messages)
        setSpecMarkdown(data.spec_markdown)
      })
    }
  }, [sessionData, sessionId, setCurrentSession, setMessages, setSpecMarkdown])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    await sendMessage(input)
  }

  const isNewSession = !sessionId

  if (isNewSession && !messages.length) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
                Describe Your Project Idea
              </h1>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
                Tell me about your project idea and I'll help you create a technical specification
              </p>
            </div>
            
            {/* Skill Level Selector for New Sessions */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                First, let me know your experience level for personalized guidance:
              </div>
              <SkillLevelSelector 
                value={skillLevel}
                onChange={setSkillLevel}
              />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <PersonaPromptBar setInput={setInput} inputRef={textareaRef} />
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., I want to build a task management app with real-time collaboration..."
                  className="w-full h-32 p-4 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <ExclamationCircleIcon className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header with Skill Level Selector */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentSession?.title || 'Project Discussion'}
          </h2>
          <SkillLevelSelector 
            value={skillLevel}
            onChange={setSkillLevel}
            className="ml-4"
          />
        </div>
      </div>

      {/* Chat and Spec Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                <div 
                  className={`p-4 rounded-lg ${
                    msg.role === 'assistant' 
                      ? 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700' 
                      : 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100 ml-auto max-w-[80%]'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {msg.content}
                  </div>
                </div>
                
                {/* Show changes summary after assistant messages */}
                {msg.role === 'assistant' && i === messages.length - 1 && lastChangesMade.length > 0 && (
                  <div className="mt-3">
                    <ChangesSummary changes={lastChangesMade} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </form>
            {error && (
              <div className="mt-2 text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Spec Section */}
        <SpecPane />
      </div>
    </div>
  )
} 