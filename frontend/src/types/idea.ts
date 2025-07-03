export interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface IdeaChatResponse {
  assistant_msg: string;
  spec_markdown: string;
  updated_sections: string[];
  changes_made?: Array<{
    type: 'added' | 'updated' | 'refined' | 'restructured';
    section: string;
    description: string;
  }>;
}

export interface IdeaSession {
  id: string;
  title: string | null;
  spec_preview: string;
  created_at: string;
  updated_at: string | null;
}

export interface SpecVersion {
  id: string;
  spec_markdown: string;
  created_at: string;
  change_data: {
    type?: string;
    description?: string;
    changes_made?: Array<{
      type: string;
      section: string;
      description: string;
    }>;
    skill_level?: string;
    [key: string]: any;
  } | null;
}

export interface IdeaSessionState {
  messages: Message[];
  specMarkdown: string;
  updatedSections: string[];
  currentSession: IdeaSession | null;
  sessions: IdeaSession[];
  isLoading: boolean;
  error: string | null;
  input: string;
  
  // Version control
  specVersions: SpecVersion[];
  currentVersionIndex: number;
  isViewingHistory: boolean;
  
  // Manual editing
  isEditing: boolean;
  editContent: string;
  preEditVersion: string | null;
  
  // Phase 1: Change communication
  lastChangesMade: Array<{
    type: 'added' | 'updated' | 'refined' | 'restructured';
    section: string;
    description: string;
  }>;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSpecMarkdown: (markdown: string) => void;
  setUpdatedSections: (sections: string[]) => void;
  setCurrentSession: (session: IdeaSession | null) => void;
  setSessions: (sessions: IdeaSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInput: (input: string | ((prev: string) => string)) => void;
  sendMessage: (userMsg: string) => Promise<void>;
  reset: () => void;
  
  // Version control actions
  loadSpecVersions: () => Promise<void>;
  navigateToVersion: (direction: 'prev' | 'next') => void;
  restoreVersion: (versionId: string) => Promise<void>;
  reloadCurrentSession: () => Promise<void>;
  
  // Manual editing actions
  startEditing: () => void;
  cancelEditing: () => void;
  saveEdit: (changeDescription?: string) => Promise<void>;
  setEditContent: (content: string) => void;
  
  // Phase 1: Change communication actions
  setLastChangesMade: (changes: Array<{type: string; section: string; description: string}>) => void;
  setSkillLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
} 