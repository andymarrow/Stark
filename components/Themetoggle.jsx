"use client";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react'; // Using Lucide for consistency

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative p-2.5 rounded-full transition-all duration-300 ease-out 
      bg-slate-100 hover:bg-slate-200 text-slate-600
      dark:bg-slate-800 dark:text-yellow-400 dark:hover:bg-slate-700
      focus:outline-none focus:ring-2 focus:ring-harvard-crimson/50"
      aria-label="Toggle Dark Mode"
    >
      <div className="relative w-5 h-5">
        <Sun className={`absolute inset-0 w-full h-full transition-transform duration-500 ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
        <Moon className={`absolute inset-0 w-full h-full transition-transform duration-500 ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      </div>
    </button>
  );
}