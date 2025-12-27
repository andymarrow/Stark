"use client";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CommTab({ 
  emailSubject, setEmailSubject, 
  emailBody, setEmailBody, 
  handleSendEmail, sendingEmail 
}) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-500 uppercase">Subject Line</label>
            <input 
                type="text" 
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="SYSTEM NOTICE: Account Review"
                className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:border-white/30 outline-none"
            />
        </div>
        <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-500 uppercase">Message Body</label>
            <textarea 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter your secure message here..."
                className="w-full h-32 bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:border-white/30 outline-none resize-none font-mono"
            />
        </div>
        <Button 
            onClick={handleSendEmail} 
            disabled={sendingEmail}
            className="w-full bg-white text-black hover:bg-zinc-200 rounded-none h-10 font-mono text-xs uppercase"
        >
            {sendingEmail ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send size={14} className="mr-2" />}
            Transmit
        </Button>
    </div>
  );
}