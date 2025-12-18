"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProfileSettings = () => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          This is how others will see you on the site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-2 border-slate-200 dark:border-slate-800">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-brand-100 text-brand-700 text-xl font-bold">JS</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
                <Button variant="outline" size="sm">Change Avatar</Button>
                <p className="text-xs text-slate-500">JPG, GIF or PNG. Max 1MB.</p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="Jason Statham" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="jason@techcorp.com" disabled className="bg-slate-100 dark:bg-slate-900 opacity-70" />
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="Software Engineer at..." />
        </div>

        <div className="flex justify-end">
            <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900">Save Changes</Button>
        </div>

      </CardContent>
    </Card>
  );
};

export default ProfileSettings;