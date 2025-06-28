import { useNavigate, useParams } from 'react-router-dom'
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import IdeaChat from './IdeaChat'
import { useEffect } from 'react'
import { useIdeaSession } from '../stores/ideaSession'
import { useAuthSession } from '../stores/authSession'
import { useQuery } from '@tanstack/react-query'
import { ideaApi } from '../services/api'
import type { IdeaSession } from '../types/idea'

export default function Dashboard() {
  const navigate = useNavigate()
  const { id: currentIdeaId } = useParams()
  const { 
    reset: resetIdeaSession, 
    setSessions,
    sessions,
    setCurrentSession 
  } = useIdeaSession()
  const { logout } = useAuthSession()

  // Fetch sessions
  const { data } = useQuery<IdeaSession[]>({
    queryKey: ['sessions'],
    queryFn: ideaApi.getSessions,
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Update sessions in store when data changes
  useEffect(() => {
    if (data) {
      setSessions(data)
    }
  }, [data, setSessions])

  // Reset idea session when navigating away
  useEffect(() => {
    if (currentIdeaId === undefined) {
      resetIdeaSession()
    }
  }, [currentIdeaId, resetIdeaSession])

  const handleSignOut = () => {
    logout()
    resetIdeaSession()
    navigate('/login')
  }

  const handleNewIdea = () => {
    resetIdeaSession()
    navigate('/dashboard/ideas/new')
  }

  const handleSelectIdea = (session: IdeaSession) => {
    setCurrentSession(session)
    navigate(`/dashboard/ideas/${session.id}`)
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left Sidebar - 20% width */}
      <div className="w-[20%] min-w-[250px] max-w-[350px] bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Logo and New Idea Button Section */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            flowde
          </h1>
          <button
            onClick={handleNewIdea}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            New Idea
          </button>
        </div>

        {/* Ideas List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Recent Ideas
            </h2>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectIdea(session)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentIdeaId === session.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <h3 className="text-sm font-medium truncate">
                    {session.title || `Untitled Idea ${session.id}`}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {session.spec_preview || 'No description yet'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No ideas yet</p>
                  <p className="text-xs mt-1">Start by describing your project idea</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:text-red-500 transition-colors" />
            <span className="group-hover:text-red-500 transition-colors">Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - 80% width */}
      <div className="flex-1 h-full">
        {currentIdeaId || window.location.pathname.includes('/ideas/new') ? (
          <IdeaChat />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to Flowde
              </h2>
              <p className="text-gray-600 mb-8">
                Transform your project ideas into visual flowcharts with AI assistance. 
                Start by describing your project idea.
              </p>
              <button
                onClick={handleNewIdea}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 