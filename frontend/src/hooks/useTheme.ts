import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get from localStorage or default to system
    return (localStorage.getItem('theme') as Theme) || 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    let newResolvedTheme: 'light' | 'dark'

    if (theme === 'system') {
      // Use system preference
      newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
    } else {
      newResolvedTheme = theme
    }

    // Apply the resolved theme
    root.classList.add(newResolvedTheme)
    setResolvedTheme(newResolvedTheme)

    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      
      const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light'
      root.classList.add(newResolvedTheme)
      setResolvedTheme(newResolvedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    toggleTheme: () => {
      setTheme(current => {
        if (current === 'light') return 'dark'
        if (current === 'dark') return 'system'
        return 'light'
      })
    }
  }
} 