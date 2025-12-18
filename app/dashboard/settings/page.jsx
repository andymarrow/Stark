"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/app/_context/ProjectContext"; // <--- 1. Import Context

import ProfileSettings from "./_components/ProfileSettings";
import ApiKeys from "./_components/ApiKeys";
import TeamSettings from "./_components/TeamSettings";
import BillingSettings from "./_components/BillingSettings";
import FeatureSettings from "./_components/FeatureSettings";
import IntegrationsSettings from "./_components/IntegrationsSettings";

export default function SettingsPage() {
  // 2. Get the active project from the global context
  const { activeProject } = useProject();

  return (
    <div className="space-y-6 mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your organization, preferences, and integrations.
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <div className="overflow-x-auto pb-2">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 inline-flex w-auto min-w-full md:min-w-0 justify-start">
            <TabsTrigger value="general">Profile</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamSettings />
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4">
          <FeatureSettings />
        </TabsContent>

        {/* 3. Pass the Project ID to the Integrations Component */}
        <TabsContent value="integrations" className="space-y-4">
            <IntegrationsSettings projectId={activeProject?._id} />
        </TabsContent>
        
        <TabsContent value="apikeys" className="space-y-4">
          <ApiKeys />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}