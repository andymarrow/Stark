"use client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Bell, Globe, Github, Twitter, Linkedin } from "lucide-react";

export default function SettingsForm({ user }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 1. Public Profile Settings */}
      <section className="space-y-6">
        <SectionHeader icon={User} title="Public Profile" description="This is how others see you on the platform." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Display Name" defaultValue={user.name} />
            <InputGroup label="Username" defaultValue={user.username} prefix="@" disabled />
            <div className="md:col-span-2">
                <InputGroup label="Bio" defaultValue={user.bio} isTextArea />
            </div>
            <InputGroup label="Location" defaultValue={user.location} />
            <InputGroup label="Portfolio URL" defaultValue={user.website} />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 2. Social Connections */}
      <section className="space-y-6">
        <SectionHeader icon={Globe} title="Connections" description="Link your accounts for auto-verification." />
        <div className="space-y-4">
            <SocialInput icon={Github} label="GitHub" defaultValue="github.com/alexc" connected />
            <SocialInput icon={Twitter} label="Twitter" placeholder="twitter.com/..." />
            <SocialInput icon={Linkedin} label="LinkedIn" placeholder="linkedin.com/in/..." />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 3. Notifications & Privacy */}
      <section className="space-y-6">
        <SectionHeader icon={Bell} title="Preferences" description="Manage what you see and hear." />
        <div className="space-y-4 max-w-xl">
            <ToggleRow label="Email Notifications" description="Receive weekly digests and major updates." defaultChecked={true} />
            <ToggleRow label="Profile Visibility" description="Allow search engines to index your profile." defaultChecked={true} />
            <ToggleRow label="For Hire Status" description="Show the 'Open to Work' badge on your profile." defaultChecked={true} />
        </div>
      </section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md py-4 border-t border-border flex justify-end gap-4">
        <Button variant="outline" className="rounded-none border-border hover:bg-secondary">Cancel</Button>
        <Button className="rounded-none bg-foreground text-background hover:bg-accent hover:text-white transition-colors">
            Save Changes
        </Button>
      </div>

    </div>
  );
}

// --- Sub-Components ---

function SectionHeader({ icon: Icon, title, description }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="p-2 bg-secondary/20 border border-border text-foreground">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-none mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground font-light">{description}</p>
            </div>
        </div>
    )
}

function InputGroup({ label, defaultValue, prefix, disabled, isTextArea, placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{label}</label>
            <div className={`flex items-center border border-border bg-background focus-within:border-accent transition-colors ${disabled ? 'opacity-50' : ''}`}>
                {prefix && (
                    <div className="px-3 py-2 bg-secondary/10 border-r border-border text-sm text-muted-foreground font-mono">
                        {prefix}
                    </div>
                )}
                {isTextArea ? (
                    <textarea 
                        defaultValue={defaultValue} 
                        className="flex-1 bg-transparent border-none outline-none p-3 text-sm min-h-[100px]"
                    />
                ) : (
                    <input 
                        type="text" 
                        defaultValue={defaultValue} 
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 bg-transparent border-none outline-none p-3 h-10 text-sm"
                    />
                )}
            </div>
        </div>
    )
}

function SocialInput({ icon: Icon, label, defaultValue, placeholder, connected }) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 bg-secondary/10 border border-border">
                <Icon size={16} />
            </div>
            <div className="flex-1 relative group">
                <input 
                    type="text" 
                    defaultValue={defaultValue} 
                    placeholder={placeholder}
                    className="w-full bg-background border-b border-border focus:border-accent outline-none py-2 text-sm transition-colors"
                />
                {connected && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-green-500 font-mono bg-green-500/10 px-2 py-0.5">
                        CONNECTED
                    </span>
                )}
            </div>
        </div>
    )
}

function ToggleRow({ label, description, defaultChecked }) {
    return (
        <div className="flex items-center justify-between p-4 border border-border bg-secondary/5">
            <div>
                <h4 className="text-sm font-bold">{label}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch defaultChecked={defaultChecked} className="data-[state=checked]:bg-accent" />
        </div>
    )
}