"use client";
import React, { useState } from "react";
import { Check, ChevronsUpDown, PlusCircle, LayoutGrid, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock Data for Demo
const MOCK_PROJECTS = [
  { _id: "1", name: "E-Commerce Store", url: "https://store.demo.com" },
  { _id: "2", name: "Corporate Landing", url: "https://corp.demo.com" },
  { _id: "3", name: "SaaS Dashboard", url: "https://app.demo.com" },
];

export default function ProjectSwitcher({ className }) {
  // Simulating the Context locally
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const [open, setOpen] = useState(false); // Popover state
  const [showCreateModal, setShowCreateModal] = useState(false); // Modal state
  
  // Form State
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    // Simulate Network Request
    setTimeout(() => {
        const newProject = {
            _id: Math.random().toString(36).substr(2, 9),
            name: newProjectName,
            url: newProjectUrl
        };
        
        setProjects([...projects, newProject]);
        setActiveProject(newProject);
        
        setShowCreateModal(false);
        setNewProjectName("");
        setNewProjectUrl("");
        setIsCreating(false);
    }, 1000);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a project"
            className={cn("w-[200px] justify-between h-9 border-slate-200 dark:border-slate-800", className)}
          >
            {isLoading ? (
                <span className="text-xs text-slate-500">Loading...</span>
            ) : activeProject ? (
                <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="truncate">{activeProject.name}</span>
                </div>
            ) : (
                <span className="text-slate-500">Select Project</span>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search project..." />
              <CommandEmpty>No project found.</CommandEmpty>
              <CommandGroup heading="My Projects">
                {projects?.map((project) => (
                  <CommandItem
                    key={project._id}
                    onSelect={() => {
                      setActiveProject(project);
                      setOpen(false);
                    }}
                    className="text-sm cursor-pointer"
                  >
                    <LayoutGrid className="mr-2 h-4 w-4 text-slate-500" />
                    {project.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        activeProject?._id === project._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem 
                    className="cursor-pointer"
                    onSelect={() => {
                        setOpen(false);
                        setShowCreateModal(true);
                    }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Project
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* CREATE PROJECT MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                        id="name" 
                        placeholder="My Awesome App" 
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        required 
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="url">Website URL</Label>
                    <Input 
                        id="url" 
                        placeholder="https://example.com" 
                        value={newProjectUrl}
                        onChange={(e) => setNewProjectUrl(e.target.value)}
                        required 
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}