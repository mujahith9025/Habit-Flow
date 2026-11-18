import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'oled';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isOled: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'habitflow-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme;
      if (saved === 'dark' || saved === 'light' || saved === 'oled') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'oled') {
      root.classList.add('dark', 'oled');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'oled');
      root.style.colorScheme = 'dark';

      if (body) {
        body.classList.add('dark', 'oled');
        body.classList.remove('light');
        body.setAttribute('data-theme', 'oled');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light', 'oled');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';

      if (body) {
        body.classList.add('dark');
        body.classList.remove('light', 'oled');
        body.setAttribute('data-theme', 'dark');
      }
    } else {
      root.classList.remove('dark', 'oled');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';

      if (body) {
        body.classList.remove('dark', 'oled');
        body.classList.add('light');
        body.setAttribute('data-theme', 'light');
      }
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore localStorage write error
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'oled';
      return 'light';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const isDark = theme === 'dark' || theme === 'oled';
  const isOled = theme === 'oled';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isOled,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
