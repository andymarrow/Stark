"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const BillingSettings = () => {
  return (
    <div className="space-y-6">
        
        {/* Current Plan */}
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-900/10 shadow-sm relative overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-brand-700 dark:text-brand-400">Pro Plan</CardTitle>
                    <CardDescription>You are on the $29/mo plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-500" />
                        <span>50,000 monthly visits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-500" />
                        <span>Advanced SEO Analytics</span>
                    </div>
                    <Button size="sm" className="mt-4 bg-brand-600 hover:bg-brand-700 text-white">
                        Upgrade Plan
                    </Button>
                </CardContent>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CreditCard className="w-24 h-24 text-brand-500" />
                </div>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>Your cycle resets on Dec 1st.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Heatmap Events</span>
                            <span className="text-slate-500">34,005 / 50,000</span>
                        </div>
                        <Progress value={68} className="h-2 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Storage</span>
                            <span className="text-slate-500">2.1 GB / 5.0 GB</span>
                        </div>
                        <Progress value={42} className="h-2 bg-slate-100 dark:bg-slate-800" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Invoice History */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
                <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {[
                        { date: "Nov 01, 2025", amount: "$29.00", status: "Paid" },
                        { date: "Oct 01, 2025", amount: "$29.00", status: "Paid" },
                        { date: "Sep 01, 2025", amount: "$29.00", status: "Paid" },
                    ].map((inv, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <CreditCard className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Pro Plan</p>
                                    <p className="text-xs text-slate-500">{inv.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{inv.amount}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default BillingSettings;