import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Leer preferencia guardada o usar preferencia del sistema
    const savedTheme = localStorage.getItem('mining-intelligence-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Guardar preferencia en localStorage
    localStorage.setItem('mining-intelligence-theme', isDarkMode ? 'dark' : 'light');
    
    // Aplicar clase al body
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      // Light Mode
      light: {
        background: '#ffffff',
        secondaryBackground: '#f8f9fa',
        text: '#333333',
        secondaryText: '#666666',
        border: '#dee2e6',
        accent: '#667eea',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8'
      },
      // Dark Mode
      dark: {
        background: '#1a1a1a',
        secondaryBackground: '#2d2d2d',
        text: '#ffffff',
        secondaryText: '#cccccc',
        border: '#404040',
        accent: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4'
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
