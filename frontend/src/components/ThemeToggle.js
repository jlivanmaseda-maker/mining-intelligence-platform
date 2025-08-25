import React from 'react';
import { useTheme } from './ThemeProvider';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '8px 12px',
        background: 'transparent',
        border: `2px solid ${isDarkMode ? '#8b5cf6' : '#667eea'}`,
        borderRadius: '20px',
        color: isDarkMode ? '#8b5cf6' : '#667eea',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.target.style.background = isDarkMode ? '#8b5cf6' : '#667eea';
        e.target.style.color = '#ffffff';
      }}
      onMouseOut={(e) => {
        e.target.style.background = 'transparent';
        e.target.style.color = isDarkMode ? '#8b5cf6' : '#667eea';
      }}
    >
      {isDarkMode ? '🌙' : '☀️'}
      {isDarkMode ? 'Dark' : 'Light'}
    </button>
  );
};

export default ThemeToggle;
