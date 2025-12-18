"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, GitBranch, Eye } from "lucide-react";

const FeatureSettings = () => {
  const [replayEnabled, setReplayEnabled] = useState(true);
  const [scanMode, setScanMode] = useState("diff");

  return (
    <div className="space-y-6">
      
      {/* ANALYTICS CONFIG */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-brand-600" />
            <CardTitle>Session Replay</CardTitle>
          </div>
          <CardDescription>Configure how we record user interactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable DOM Recording</Label>
              <p className="text-sm text-slate-500">
                Record actual video-like sessions of user behavior.
              </p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">PRO</Badge>
                <Switch checked={replayEnabled} onCheckedChange={setReplayEnabled} />
            </div>
          </div>

          {replayEnabled && (
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Privacy Masking</span>
                    <Select defaultValue="strict">
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="strict">Strict (Mask All Text)</SelectItem>
                            <SelectItem value="input">Inputs Only</SelectItem>
                            <SelectItem value="none">No Masking (Risky)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
          )}
        </CardContent>
      </Card>

      {/* CODE HEALTH CONFIG */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600" />
            <CardTitle>Code Audit Strategy</CardTitle>
          </div>
          <CardDescription>Define how deep our AI agent looks into your PRs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => setScanMode("diff")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        scanMode === "diff" 
                        ? "border-brand-600 bg-brand-50 dark:bg-brand-900/10" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                >
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm">Incremental Scan</span>
                        {scanMode === "diff" && <div className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">✓</div>}
                    </div>
                    <p className="text-xs text-slate-500">
                        Only scans changed lines in the PR. Faster and cheaper.
                    </p>
                </div>

                <div 
                    onClick={() => setScanMode("full")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        scanMode === "full" 
                        ? "border-brand-600 bg-brand-50 dark:bg-brand-900/10" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                >
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm">Deep Context Scan</span>
                         {scanMode === "full" && <div className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">✓</div>}
                    </div>
                    <p className="text-xs text-slate-500">
                        Scans the entire file for context. Finds deeper bugs.
                    </p>
                </div>
            </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureSettings;