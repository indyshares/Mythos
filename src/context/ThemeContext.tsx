import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_COLORS = {
  dark: '#38bdf8', // Electric Cyan / Sky 400
  light: '#0284c7', // Sky 700
};

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  activeAccentHex: string;
  accentStyle: {
    bg: React.CSSProperties;
    text: React.CSSProperties;
    border: React.CSSProperties;
    subtleBg: React.CSSProperties;
    hoverBg: React.CSSProperties;
  };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const DARK_MODE_STORAGE_KEY = 'mythos_is_dark';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Default to dark mode
  });

  const setIsDarkMode = (val: boolean) => {
    setIsDarkModeState(val);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(val));
  };

  const activeAccentHex = isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light;

  // Apply CSS variables and dark mode class to :root
  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.style.setProperty('--accent-color', activeAccentHex);
    root.style.setProperty('--accent-text', activeAccentHex);
    root.style.setProperty('--accent-border', `${activeAccentHex}55`);
    root.style.setProperty('--accent-subtle', `${activeAccentHex}1f`);
    root.style.setProperty('--accent-hover', `${activeAccentHex}dd`);
  }, [isDarkMode, activeAccentHex]);

  const accentStyle = {
    bg: { backgroundColor: activeAccentHex },
    text: { color: activeAccentHex },
    border: { borderColor: activeAccentHex },
    subtleBg: { backgroundColor: `${activeAccentHex}15` },
    hoverBg: { backgroundColor: activeAccentHex },
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        activeAccentHex,
        accentStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
