"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Github, Check, AlertCircle } from "lucide-react";

const IntegrationsSettings = ({ projectId }) => {
  const [copied, setCopied] = useState(false);
  
  // Construct the Unique URL based on the passed prop
  const baseUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site") || "https://your-convex-url.site";
  
  // Fallback if no project is selected yet
  const webhookUrl = projectId 
    ? `${baseUrl}/github-webhook?projectId=${projectId}`
    : "Please select a project from the top-left switcher first.";

  const handleCopy = () => {
    if (!projectId) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" /> GitHub Integration
        </CardTitle>
        <CardDescription>
            To enable Code Health, add this Webhook to your GitHub Repository settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500">Payload URL</span>
                {projectId ? (
                    <span className="text-[10px] text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full font-mono">
                        ID: {projectId.slice(0, 12)}...
                    </span>
                ) : (
                    <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> No Project Selected
                    </span>
                )}
            </div>
            
            <div className="flex gap-2">
                <Input 
                    value={webhookUrl} 
                    readOnly 
                    className={`font-mono text-xs h-9 bg-white dark:bg-slate-950 ${!projectId ? "text-slate-400 italic" : ""}`} 
                />
                <Button size="sm" variant="outline" onClick={handleCopy} disabled={!projectId}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
                <p>1. Go to your GitHub Repo &gt; <strong>Settings</strong> &gt; <strong>Webhooks</strong>.</p>
                <p>2. Paste the URL above into <strong>Payload URL</strong>.</p>
                <p>3. Select Content type: <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">application/json</span>.</p>
                <p>4. Select event: <span className="font-mono text-slate-700 dark:text-slate-300">Just the push event</span>.</p>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default IntegrationsSettings;