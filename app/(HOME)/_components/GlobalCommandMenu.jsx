"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CreditCard,
  Settings,
  User,
  LayoutGrid,
  Zap,
  LogOut,
  Moon,
  Sun,
  Code,
  Laptop,
  Plus
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function GlobalCommandMenu({ open, setOpen }) {
  const router = useRouter();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const run = (command) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => router.push('/explore'))}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Explore</span>
            <CommandShortcut>G E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push('/trending'))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Trending</span>
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push('/create'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Project</span>
            <CommandShortcut>C P</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Profile & Settings */}
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => run(() => router.push('/profile/miheret_dev'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘ P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push('/profile?view=settings'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <CommandShortcut>⌘ B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push('/profile?view=settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘ S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme Control */}
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
            <CommandItem onSelect={() => run(() => router.push('/login'))}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
            </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}