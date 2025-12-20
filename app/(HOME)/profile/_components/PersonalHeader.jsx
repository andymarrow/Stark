"use client";
import { useState } from "react";
import Image from "next/image";
import { Settings, Edit3, Share2, MapPin, Link as LinkIcon, Calendar, Camera, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PersonalHeader({ user }) {
  // Local state for immediate UI feedback
  const [profileData, setProfileData] = useState(user);
  const [isEditing, setIsEditing] = useState(false);

  // Temporary state for the form inputs
  const [tempData, setTempData] = useState(user);

  const handleSave = () => {
    setProfileData(tempData);
    setIsEditing(false);
    // In a real app, you would make an API call here
  };

  const handleImageUpload = () => {
    alert("This would open your file picker!");
  };

  return (
    <div className="bg-background border-b border-border pb-8">
      
      {/* 1. Cover / Banner Area */}
      <div className="h-32 w-full bg-secondary/30 border-b border-border relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
        {/* Cover Image Edit Trigger */}
        <button className="absolute top-4 right-4 bg-black/50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
            <Camera size={16} />
        </button>
      </div>

      <div className="container mx-auto px-4 -mt-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Avatar with Edit Badge */}
            {/* CLICKING THIS OPENS DIALOG */}
            <div 
                className="relative group cursor-pointer" 
                onClick={() => setIsEditing(true)}
            >
                <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-background bg-secondary relative overflow-hidden shadow-lg">
                    <Image src={profileData.avatar} alt="Me" fill className="object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono cursor-pointer">
                    EDIT
                </div>
            </div>

            {/* --- EDIT PROFILE DIALOG (Controlled State) --- */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[500px] border-border bg-background p-0 rounded-none gap-0">
                    <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                        <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Edit3 size={18} />
                            Edit Profile
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 space-y-6">
                        {/* Avatar Upload Section */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 border border-border">
                                <Image src={tempData.avatar} alt="Preview" fill className="object-cover" />
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={handleImageUpload}
                                className="h-9 rounded-none border-dashed border-border hover:border-accent text-xs font-mono"
                            >
                                <UploadCloud size={14} className="mr-2" />
                                Change Avatar
                            </Button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase text-muted-foreground">Display Name</Label>
                                <Input 
                                    value={tempData.name} 
                                    onChange={(e) => setTempData({...tempData, name: e.target.value})}
                                    className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase text-muted-foreground">Bio</Label>
                                <textarea 
                                    value={tempData.bio} 
                                    onChange={(e) => setTempData({...tempData, bio: e.target.value})}
                                    className="flex min-h-[80px] w-full border border-border bg-secondary/10 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono uppercase text-muted-foreground">Location</Label>
                                    <Input 
                                        value={tempData.location} 
                                        onChange={(e) => setTempData({...tempData, location: e.target.value})}
                                        className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono uppercase text-muted-foreground">Website</Label>
                                    <Input 
                                        value={tempData.website} 
                                        onChange={(e) => setTempData({...tempData, website: e.target.value})}
                                        className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-none border-border hover:bg-secondary">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-white rounded-none">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Info & Quick Actions */}
            <div className="flex-1 w-full pt-2 md:pt-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                            {profileData.name}
                            {profileData.plan === 'pro' && (
                                <span className="text-[10px] bg-accent text-white px-2 py-0.5 font-mono tracking-wider uppercase">PRO</span>
                            )}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">@{profileData.username}</p>
                        
                        <p className="mt-3 text-sm max-w-lg text-foreground/80 font-light">
                            {profileData.bio}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-1"><MapPin size={12}/> {profileData.location}</div>
                            <div className="flex items-center gap-1"><LinkIcon size={12}/> {profileData.website}</div>
                            <div className="flex items-center gap-1"><Calendar size={12}/> Joined {profileData.joined}</div>
                        </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                        {/* BUTTON ALSO OPENS DIALOG via onClick */}
                        <Button 
                            onClick={() => setIsEditing(true)} 
                            className="flex-1 md:flex-none h-10 bg-secondary/50 border border-border text-foreground hover:border-accent hover:text-accent rounded-none font-mono text-xs uppercase tracking-wide"
                        >
                            <Edit3 size={14} className="mr-2" /> Edit Profile
                        </Button>
                        
                        <Button className="flex-1 md:flex-none h-10 bg-secondary/50 border border-border text-foreground hover:border-foreground rounded-none font-mono text-xs uppercase tracking-wide">
                            <Share2 size={14} className="mr-2" /> Share
                        </Button>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
}