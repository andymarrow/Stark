"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/_context/AuthContext";

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", 
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", 
  "b", "a"
];

export default function KonamiListener() {
  const { user } = useAuth();
  const [inputSequence, setInputSequence] = useState([]);

  useEffect(() => {
    if (!user) return;

    const handleKeyDown = async (e) => {
      // Create a new sequence array by adding the new key, and keeping only the last N keys
      const newSequence = [...inputSequence, e.key].slice(-KONAMI_CODE.length);
      setInputSequence(newSequence);

      // Check if sequence matches
      if (newSequence.join(',').toLowerCase() === KONAMI_CODE.join(',').toLowerCase()) {
        
        // Code Matched! Trigger the API
        try {
            await fetch('/api/achievements/award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badgeId: 'konami_code' })
            });
            // The BadgeListener we built earlier will automatically detect this DB change and show the modal!
        } catch (err) {
            console.error(err);
        }
        
        // Reset sequence
        setInputSequence([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputSequence, user]);

  return null; // Invisible component
}