import { UserIcon, CodeBracketIcon, CommandLineIcon, CloudIcon } from '@heroicons/react/24/outline'

const PERSONA_TEMPLATES = {
  'Idea Person': "I have an idea for **<project type>** that will help **<target users>** to **<main benefit>**. The key features would include **<key feature 1>**, **<key feature 2>**, and **<key feature 3>**.",
  'Bootcamp Builder': "I want to build a **<project type>** for **<platform>** using **<tech stack>**. Core features: **<feature 1>**, **<feature 2>**. I need best-practice architecture tips.",
  'Seasoned Engineer': "I need to architect a scalable **<project type>** with **<tech requirements>**. Key non-functional goals: **<goal 1>**, **<goal 2>**, **<goal 3>**.",
  'Cloud/ML Architect': "I'm designing a **<project type>** that includes ML capabilities (**<model/task>**) and must run on **<cloud provider / infra>**. It should handle **<scale requirement>** and integrate with **<API/service>**."
}

interface PersonaPromptBarProps {
  setInput: (input: string) => void
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>
}

export const PersonaPromptBar = ({ setInput, inputRef }: PersonaPromptBarProps) => {
  const handlePersonaClick = (template: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent form submission
    setInput(template)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div className="flex flex-wrap gap-2">
        <button
          type="button" // Explicitly set button type to prevent form submission
          onClick={(e) => handlePersonaClick(PERSONA_TEMPLATES['Idea Person'], e)}
          className="persona-button"
        >
          <UserIcon className="w-4 h-4" />
          Idea Person
        </button>
        <button
          type="button"
          onClick={(e) => handlePersonaClick(PERSONA_TEMPLATES['Bootcamp Builder'], e)}
          className="persona-button"
        >
          <CodeBracketIcon className="w-4 h-4" />
          Bootcamp Builder
        </button>
        <button
          type="button"
          onClick={(e) => handlePersonaClick(PERSONA_TEMPLATES['Seasoned Engineer'], e)}
          className="persona-button"
        >
          <CommandLineIcon className="w-4 h-4" />
          Seasoned Engineer
        </button>
        <button
          type="button"
          onClick={(e) => handlePersonaClick(PERSONA_TEMPLATES['Cloud/ML Architect'], e)}
          className="persona-button"
        >
          <CloudIcon className="w-4 h-4" />
          Cloud/ML Architect
        </button>
      </div>
    </div>
  )
} 