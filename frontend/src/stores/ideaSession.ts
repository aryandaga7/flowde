import { create } from 'zustand'
import type { Message, IdeaSessionState } from '../types/idea'
import { ideaApi } from '../services/api'

export const useIdeaSession = create<IdeaSessionState>((set, get) => ({
  messages: [],
  specMarkdown: '',
  updatedSections: [],
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  input: '',
  
  // Version control
  specVersions: [],
  currentVersionIndex: -1, // -1 means current version (not viewing history)
  isViewingHistory: false,
  
  // Manual editing
  isEditing: false,
  editContent: '',
  preEditVersion: null,
  
  // Phase 1: Change communication
  lastChangesMade: [],
  skillLevel: 'intermediate',

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
  setSpecMarkdown: (markdown) => set({ specMarkdown: markdown }),
  setUpdatedSections: (sections) => set({ updatedSections: sections }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setInput: (input) => set((state) => ({ 
    input: typeof input === 'function' ? input(state.input) : input 
  })),

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
        messages: [...state.messages, userMessage],
        input: '' // Clear input after sending
      }))

      // Create session if this is the first message
      if (!sessionId) {
        console.log('Creating new session for first message...')
        const newSession = await ideaApi.createSession()
        sessionId = newSession.id
        set({ currentSession: newSession })
      }

      // Send to API with skill level
      const response = await ideaApi.sendMessage(sessionId, userMsg, state.skillLevel)
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
        updatedSections: response.updated_sections,
        lastChangesMade: response.changes_made || [], // Store changes for Phase 1
        isLoading: false,
        // Reset version navigation when spec is updated
        currentVersionIndex: -1,
        isViewingHistory: false
      }))
      
      // Reload versions if we have a session
      if (sessionId) {
        get().loadSpecVersions()
      }
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

  // Version control methods
  loadSpecVersions: async () => {
    const state = get()
    if (!state.currentSession?.id) return

    try {
      const versions = await ideaApi.getSpecVersions(state.currentSession.id)
      set({ specVersions: versions })
    } catch (error) {
      console.error('Error loading spec versions:', error)
      set({ error: 'Failed to load spec versions' })
    }
  },

  reloadCurrentSession: async () => {
    const state = get()
    if (!state.currentSession?.id) return

    try {
      const sessionData = await ideaApi.getSessionMessages(state.currentSession.id)
      set({ 
        specMarkdown: sessionData.spec_markdown,
        messages: sessionData.messages
      })
    } catch (error) {
      console.error('Error reloading session:', error)
      set({ error: 'Failed to reload session data' })
    }
  },

  navigateToVersion: (direction: 'prev' | 'next') => {
    const state = get()
    const { specVersions, currentVersionIndex } = state
    
    // If no versions loaded yet, can't navigate
    if (specVersions.length === 0) return

    let newIndex: number
    
    if (currentVersionIndex === -1) {
      // Currently viewing live version (latest)
      if (direction === 'prev' && specVersions.length > 0) {
        newIndex = 0 // Go to newest historical version (same as current, but in history mode)
      } else {
        return // Can't go next from live version
      }
    } else {
      // Currently viewing a historical version
      if (direction === 'prev') {
        // Go to older version (higher index)
        newIndex = Math.min(currentVersionIndex + 1, specVersions.length - 1)
      } else {
        // Go to newer version (lower index)  
        newIndex = currentVersionIndex - 1
      }
    }
    
    // If going back to live version (index -1)
    if (newIndex < 0) {
      set({ 
        currentVersionIndex: -1,
        isViewingHistory: false
      })
      // Reload current session to restore live version
      get().reloadCurrentSession()
      return
    }
    
    // Set viewing historical version
    const version = specVersions[newIndex]
    if (version) {
      set({ 
        currentVersionIndex: newIndex,
        isViewingHistory: true,
        specMarkdown: version.spec_markdown,
        updatedSections: [] // Clear updates when viewing history
      })
    }
  },

  restoreVersion: async (versionId: string) => {
    const state = get()
    if (!state.currentSession?.id) return

    try {
      set({ isLoading: true, error: null })
      const response = await ideaApi.restoreVersion(state.currentSession.id, versionId)
      
      set({ 
        specMarkdown: response.spec_markdown,
        currentVersionIndex: -1,
        isViewingHistory: false,
        isLoading: false
      })
      
      // Reload versions to include the restoration
      await get().loadSpecVersions()
    } catch (error) {
      console.error('Error restoring version:', error)
      set({ 
        error: 'Failed to restore version',
        isLoading: false
      })
    }
  },

  // Manual editing methods
  startEditing: () => {
    const state = get()
    // Prevent editing while viewing historical versions to avoid data corruption
    if (state.isViewingHistory) {
      console.warn('Cannot start editing while viewing historical version')
      return
    }
    
    set({ 
      isEditing: true,
      editContent: state.specMarkdown,
      preEditVersion: state.specMarkdown
    })
  },

  cancelEditing: () => {
    const state = get()
    set({ 
      isEditing: false,
      editContent: '',
      specMarkdown: state.preEditVersion || state.specMarkdown,
      preEditVersion: null
    })
  },

  saveEdit: async (changeDescription?: string) => {
    const state = get()
    if (!state.currentSession?.id) return

    try {
      set({ isLoading: true, error: null })
      const response = await ideaApi.updateSpec(
        state.currentSession.id, 
        state.editContent,
        changeDescription
      )
      
      set({ 
        specMarkdown: response.spec_markdown,
        isEditing: false,
        editContent: '',
        preEditVersion: null,
        isLoading: false,
        currentVersionIndex: -1,
        isViewingHistory: false
      })
      
      // Reload versions to include the manual edit
      await get().loadSpecVersions()
    } catch (error) {
      console.error('Error saving edit:', error)
      set({ 
        error: 'Failed to save changes',
        isLoading: false
      })
    }
  },

  setEditContent: (content: string) => set({ editContent: content }),
  
  // Phase 1: Change communication methods
  setLastChangesMade: (changes) => set({ lastChangesMade: changes as Array<{type: 'added' | 'updated' | 'refined' | 'restructured'; section: string; description: string}> }),
  setSkillLevel: (level) => set({ skillLevel: level }),

  reset: () => set({ 
    messages: [], 
    specMarkdown: '', 
    updatedSections: [],
    currentSession: null,
    isLoading: false,
    error: null,
    input: '',
    specVersions: [],
    currentVersionIndex: -1,
    isViewingHistory: false,
    isEditing: false,
    editContent: '',
    preEditVersion: null,
    lastChangesMade: [],
    skillLevel: 'intermediate'
  })
})) 