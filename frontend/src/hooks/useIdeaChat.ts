import { useMutation } from '@tanstack/react-query'
import { ideaApi } from '../services/api'
import { useIdeaSession } from '../stores/ideaSession'
import type { Message } from '../types/idea'

export const useIdeaChat = () => {
  const { addMessage, setSpecMarkdown, currentSession } = useIdeaSession()

  return useMutation({
    mutationFn: async (content: string) => {
      if (!currentSession?.id) {
        throw new Error('No active session')
      }
      // Add user message immediately
      addMessage({ role: 'user', content } as Message)
      return ideaApi.sendMessage(currentSession.id, content)
    },
    onSuccess: (data) => {
      addMessage({
        role: 'assistant',
        content: data.assistant_msg
      })
      setSpecMarkdown(data.spec_markdown)
    }
  })
} 