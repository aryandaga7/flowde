export interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface IdeaChatResponse {
  assistant_msg: string;
  spec_markdown: string;
}

export interface IdeaSession {
  id: string;
  title: string | null;
  spec_preview: string;
  created_at: string;
  updated_at: string | null;
}

export interface IdeaSessionState {
  messages: Message[];
  specMarkdown: string;
  currentSession: IdeaSession | null;
  sessions: IdeaSession[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSpecMarkdown: (markdown: string) => void;
  setCurrentSession: (session: IdeaSession | null) => void;
  setSessions: (sessions: IdeaSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  sendMessage: (userMsg: string) => Promise<void>;
  reset: () => void;
} 