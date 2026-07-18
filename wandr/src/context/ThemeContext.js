import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Theme is applied as data-theme on <html>; styles.css overrides the CSS
// variables for "light". Persisted so it survives reloads.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('wandr-theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('wandr-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
