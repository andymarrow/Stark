import React from "react";
import DashboardSidebar from "./_components/DashboardSidebar";
import DashboardHeader from "./_components/DashboardHeader";
import { ProjectProvider } from "@/app/_context/ProjectContext";

export const metadata = {
  title: "Dashboard | OmniOptimize",
  description: "Manage your projects.",
};

export default function DashboardLayout({ children }) {
  return (
    <ProjectProvider>
          <div className="flex h-screen bg-slate-50 dark:bg-[#020617] overflow-hidden">
            
            {/* DESKTOP SIDEBAR 
                - hidden by default (mobile)
                - block on md (desktop)
                - fixed width 
            */}
            <aside className="hidden md:block w-64 h-full flex-shrink-0">
              <DashboardSidebar />
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
              <DashboardHeader />
              
              {/* Scrollable Page Content 
                  - min-w-0 ensures graphs/tables shrink correctly instead of overflowing 
              */}
              <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                  <div className="mx-auto max-w-6xl min-w-0">
                      {children}
                  </div>
              </main>
            </div>

          </div>
    </ProjectProvider>
    
  );
}