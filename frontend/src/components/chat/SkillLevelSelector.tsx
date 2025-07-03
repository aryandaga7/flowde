import { 
  AcademicCapIcon,
  CodeBracketIcon,
  CommandLineIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'

interface SkillLevelSelectorProps {
  value: 'beginner' | 'intermediate' | 'advanced';
  onChange: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  className?: string;
}

const skillLevels = [
  {
    value: 'beginner' as const,
    label: 'Beginner',
    description: 'CS student or new developer',
    icon: <AcademicCapIcon className="w-4 h-4" />,
    colorClass: 'skill-beginner'
  },
  {
    value: 'intermediate' as const,
    label: 'Intermediate', 
    description: '1-3 years experience',
    icon: <CodeBracketIcon className="w-4 h-4" />,
    colorClass: 'skill-intermediate'
  },
  {
    value: 'advanced' as const,
    label: 'Advanced',
    description: 'Senior dev or architect',
    icon: <CommandLineIcon className="w-4 h-4" />,
    colorClass: 'skill-advanced'
  }
]

export const SkillLevelSelector = ({ value, onChange, className = '' }: SkillLevelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedLevel = skillLevels.find(level => level.value === value) || skillLevels[1]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:opacity-80 ${selectedLevel.colorClass}`}
      >
        {selectedLevel.icon}
        <span className="text-sm font-medium">{selectedLevel.label}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Choose your experience level
            </div>
            {skillLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => {
                  onChange(level.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  value === level.value ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <div className={`flex-shrink-0 p-1 rounded ${level.colorClass}`}>
                  {level.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {level.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {level.description}
                  </div>
                </div>
                {value === level.value && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 