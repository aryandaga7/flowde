import { 
  CheckCircleIcon, 
  ArrowPathIcon, 
  PencilSquareIcon, 
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

interface Change {
  type: 'added' | 'updated' | 'refined' | 'restructured';
  section: string;
  description: string;
}

interface ChangesSummaryProps {
  changes: Change[];
  className?: string;
}

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'added':
      return <CheckCircleIcon className="w-4 h-4 text-green-600" />
    case 'updated':
      return <ArrowPathIcon className="w-4 h-4 text-blue-600" />
    case 'refined':
      return <PencilSquareIcon className="w-4 h-4 text-yellow-600" />
    case 'restructured':
      return <WrenchScrewdriverIcon className="w-4 h-4 text-purple-600" />
    default:
      return <ArrowPathIcon className="w-4 h-4 text-gray-600" />
  }
}

const getChangeClass = (type: string) => {
  switch (type) {
    case 'added':
      return 'change-added'
    case 'updated':
      return 'change-updated'
    case 'refined':
      return 'change-refined'
    case 'restructured':
      return 'change-restructured'
    default:
      return 'change-default'
  }
}

const getChangeVerb = (type: string) => {
  switch (type) {
    case 'added':
      return 'Added'
    case 'updated':
      return 'Updated'
    case 'refined':
      return 'Refined'
    case 'restructured':
      return 'Restructured'
    default:
      return 'Modified'
  }
}

export const ChangesSummary = ({ changes, className = '' }: ChangesSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!changes || changes.length === 0) {
    return null
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Changes Made
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {changes.length} {changes.length === 1 ? 'change' : 'changes'}
          </span>
        </div>
      </div>

      {/* Changes List */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3 space-y-2">
            {changes.map((change, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getChangeClass(change.type)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getChangeIcon(change.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {getChangeVerb(change.type)}
                    </span>
                    <span className="text-sm font-medium">
                      {change.section}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">
                    {change.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 