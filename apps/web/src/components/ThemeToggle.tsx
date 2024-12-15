import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600" />
      ) : (
        <Sun className="w-5 h-5 text-gray-300" />
      )}
    </button>
  );
}; 