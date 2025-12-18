"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, RefreshCw, AlertTriangle, Check } from "lucide-react";

const ApiKeys = () => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("sk_live_51Mx8s9D8s...");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
                <CardTitle>Production Keys</CardTitle>
                <CardDescription>
                    Use these keys to authenticate requests from your application.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                
                {/* Publishable Key */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Publishable Key</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input value="pk_live_51Mx8s9D8s7F6G5H4J3K2L1" readOnly className="font-mono bg-slate-50 dark:bg-slate-950 pr-10" />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText("pk_live...")}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500">Safe to include in client-side code (React/Next.js).</p>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Secret Key</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input 
                                type={showKey ? "text" : "password"} 
                                value="sk_live_51Mx8s9D8s7F6G5H4J3K2L1_VERY_SECRET" 
                                readOnly 
                                className="font-mono bg-slate-50 dark:bg-slate-950 pr-10" 
                            />
                            <button 
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleCopy}>
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-md text-xs text-amber-700 dark:text-amber-400 mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        Never share your secret key or commit it to GitHub.
                    </div>
                </div>

            </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/30 shadow-sm">
            <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 text-base">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">Roll API Keys</p>
                        <p className="text-sm text-slate-500">This will invalidate existing keys immediately.</p>
                    </div>
                    <Button variant="destructive" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" /> Roll Keys
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default ApiKeys;