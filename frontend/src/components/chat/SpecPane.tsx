import ReactMarkdown from 'react-markdown'
import { useIdeaSession } from '../../stores/ideaSession'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export const SpecPane = () => {
  const { specMarkdown, isLoading } = useIdeaSession()
  const hasRequiredSections = 
    specMarkdown.includes('## Features') && 
    specMarkdown.includes('## Tech Stack')

  return (
    <div className="w-1/2 h-full overflow-auto bg-white p-4 border-l relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-blue-600">
            <ArrowPathIcon className="w-6 h-6 animate-spin" />
            <span>Updating specification...</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="prose max-w-none dark:prose-invert">
        {specMarkdown ? (
          <ReactMarkdown>{specMarkdown}</ReactMarkdown>
        ) : (
          <div className="text-gray-500 italic">
            Start describing your project idea to generate a technical specification.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white pt-4 border-t mt-4">
        <button 
          disabled={!hasRequiredSections || isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          Generate Flowchart
        </button>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {!hasRequiredSections && specMarkdown && 
            "Complete the Features and Tech Stack sections to generate a flowchart"}
        </p>
      </div>
    </div>
  )
} 