import { create } from 'zustand'
import type { Message, IdeaSessionState, IdeaSession } from '../types/idea'
import { ideaApi } from '../services/api'

export const useIdeaSession = create<IdeaSessionState>((set, get) => ({
  messages: [],
  specMarkdown: '',
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
  setSpecMarkdown: (markdown) => set({ specMarkdown: markdown }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  sendMessage: async (userMsg: string) => {
    const state = get()
    let sessionId = state.currentSession?.id

    try {
      console.log('Processing message...')
      set({ isLoading: true, error: null })

      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: userMsg,
        created_at: new Date().toISOString()
      }
      set((state) => ({ 
        messages: [...state.messages, userMessage]
      }))

      // Create session if this is the first message
      if (!sessionId) {
        console.log('Creating new session for first message...')
        const newSession = await ideaApi.createSession()
        sessionId = newSession.id
        set({ currentSession: newSession })
      }

      // Send to API
      const response = await ideaApi.sendMessage(sessionId, userMsg)
      console.log('Received response:', response)

      // Add assistant message and update spec
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.assistant_msg,
        created_at: new Date().toISOString()
      }
      set((state) => ({ 
        messages: [...state.messages, assistantMessage],
        specMarkdown: response.spec_markdown,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove the user message if the request failed
      set((state) => ({ 
        messages: state.messages.slice(0, -1),
        error: 'Failed to send message. Please try again.',
        isLoading: false
      }))
    }
  },

  reset: () => set({ 
    messages: [], 
    specMarkdown: '', 
    currentSession: null,
    isLoading: false,
    error: null
  })
})) 