import { useFetcher } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import type { Theme } from '../lib/theme';

interface ThemeToggleProps {
  theme: Theme;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const resolvedTheme = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolvedTheme);
}

function getThemeLabel(theme: Theme): string {
  if (theme === 'system') {
    return `System`;
  }
  return theme === 'dark' ? 'Dark' : 'Light';
}

export default function ThemeToggle({ theme }: ThemeToggleProps) {
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => 
    typeof window !== 'undefined' ? resolveTheme(theme) : 'light'
  );
  
  // Track the optimistic theme for immediate UI feedback
  const pendingTheme = fetcher.formData?.get('theme') as Theme | undefined;
  const currentTheme = pendingTheme || theme;
  
  // Update resolved theme when theme changes or system preference changes
  useEffect(() => {
    const resolved = resolveTheme(currentTheme);
    setResolvedTheme(resolved);
    applyTheme(currentTheme);
    
    // Listen for system theme changes
    if (currentTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        document.documentElement.setAttribute('data-theme', newResolved);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [currentTheme]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const handleThemeChange = (newTheme: Theme) => {
    setIsOpen(false);
    
    // Apply theme immediately for instant feedback
    applyTheme(newTheme);
    
    // Set cookie client-side immediately (for dev mode and instant persistence)
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; samesite=lax`;
    
    // Submit to server to persist in cookie (for SSR/production)
    const formData = new FormData();
    formData.append('theme', newTheme);
    fetcher.submit(formData, { method: 'POST', action: '/theme' });
  };
  
  return (
    <div className="theme-toggle" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle-button"
        aria-label="Select theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={fetcher.state === 'submitting'}
      >
        {getThemeLabel(currentTheme)}
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          style={{ marginLeft: '6px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="theme-toggle-menu" role="menu">
          <button
            onClick={() => handleThemeChange('light')}
            className={`theme-toggle-option ${currentTheme === 'light' ? 'active' : ''}`}
            role="menuitem"
          >
            Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`theme-toggle-option ${currentTheme === 'dark' ? 'active' : ''}`}
            role="menuitem"
          >
            Dark
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`theme-toggle-option ${currentTheme === 'system' ? 'active' : ''}`}
            role="menuitem"
          >
            {getThemeLabel('system')}
          </button>
        </div>
      )}
    </div>
  );
}

