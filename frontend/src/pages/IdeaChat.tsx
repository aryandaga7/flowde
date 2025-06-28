import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useIdeaSession } from '../stores/ideaSession'
import { SpecPane } from '../components/chat/SpecPane'
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { ideaApi } from '../services/api'

export default function IdeaChat() {
  const { id: sessionId } = useParams()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    setCurrentSession,
    currentSession,
    setMessages,
    setSpecMarkdown
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
    setInput('')
  }

  const isNewSession = !sessionId

  if (isNewSession && !messages.length) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-center">
                Describe Your Project Idea
              </h1>
              <p className="mt-2 text-center text-gray-600">
                Tell me about your project idea and I'll help you create a technical specification
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., I want to build a task management app with real-time collaboration..."
                className="w-full h-32 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
                disabled={isLoading}
              />
              {error && (
                <div className="text-red-600 flex items-center gap-2">
                  <ExclamationCircleIcon className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
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
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {currentSession?.title || 'Project Discussion'}
        </h2>
      </div>

      {/* Chat and Spec Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg ${
                  msg.role === 'assistant' 
                    ? 'bg-gray-50 border border-gray-100' 
                    : 'bg-blue-50 ml-auto max-w-[80%]'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center gap-2"
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
              <div className="mt-2 text-red-600 flex items-center gap-2 text-sm">
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