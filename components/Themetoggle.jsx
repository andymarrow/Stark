"use client";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="h-9 w-9 border border-border bg-background" />
  );

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative h-9 w-9 flex items-center justify-center rounded-none 
                 border border-border bg-background
                 hover:bg-secondary hover:border-accent/50
                 text-muted-foreground hover:text-foreground 
                 transition-all duration-300 ease-out"
      aria-label="Toggle Dark Mode"
    >
      <div className="relative w-4 h-4">
        {/* Sun Icon */}
        <Sun 
          className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out
            ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} 
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out
            ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} 
        />
      </div>
    </button>
  );
}