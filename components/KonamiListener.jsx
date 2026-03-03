"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/_context/AuthContext";

// Obfuscated Sequence (KeyCodes)
const SEQUENCE = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

export default function KonamiListener() {
  const { user } = useAuth();
  const [input, setInput] = useState([]);

  useEffect(() => {
    if (!user) return;

    const handleKeyDown = async (e) => {
      // Use keyCode instead of readable "key" strings
      const newItem = e.keyCode;
      
      const nextInput = [...input, newItem].slice(-SEQUENCE.length);
      setInput(nextInput);

      // Check pattern
      if (JSON.stringify(nextInput) === JSON.stringify(SEQUENCE)) {
        try {
            await fetch('/api/achievements/award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badgeId: 'konami_code' })
            });
            // Reset after success
            setInput([]);
        } catch (err) {
            console.error("Signal lost.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [input, user]);

  return null; 
}