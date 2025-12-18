"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus } from "lucide-react";

const members = [
  { name: "Jason Statham", email: "jason@techcorp.com", role: "Owner", status: "Active" },
  { name: "Sarah Connor", email: "sarah@techcorp.com", role: "Admin", status: "Active" },
  { name: "John Wick", email: "john@techcorp.com", role: "Viewer", status: "Pending" },
];

const TeamSettings = () => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to this project.</CardDescription>
        </div>
        <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {members.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="font-normal text-xs">
                            {member.role}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamSettings;