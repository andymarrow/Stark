"use client";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:border group-[.toaster]:rounded-none group-[.toaster]:shadow-lg group-[.toaster]:font-mono group-[.toaster]:text-xs group-[.toaster]:uppercase group-[.toaster]:tracking-wider",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-red-500 group-[.toaster]:text-red-500",
          success: "group-[.toaster]:border-green-500 group-[.toaster]:text-green-500",
        },
      }}
    />
  );
}