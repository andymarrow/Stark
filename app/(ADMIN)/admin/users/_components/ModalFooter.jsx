"use client";
import { Ban, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ModalFooter({ user, onBan, onDelete, isBanned }) {
  return (
    <div className="p-4 border-t border-white/10 bg-zinc-900/30 flex justify-between items-center">
        <div className="text-[10px] font-mono text-zinc-600">
            ID: {user.id}
        </div>
        
        <div className="flex gap-2">
            {/* Toggle Ban Button */}
            <Button 
                onClick={onBan}
                className={`h-9 border text-xs font-mono uppercase tracking-wider rounded-none
                    ${isBanned 
                        ? "bg-green-900/20 text-green-500 border-green-900/50 hover:bg-green-600 hover:text-white" 
                        : "bg-orange-900/20 text-orange-500 border-orange-900/50 hover:bg-orange-600 hover:text-white"
                    }
                `}
            >
                {isBanned ? <><CheckCircle size={14} className="mr-2" /> Unban</> : <><Ban size={14} className="mr-2" /> Ban</>}
            </Button>

            {/* Delete Button */}
            <Button 
                onClick={onDelete}
                className="h-9 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white rounded-none text-xs font-mono uppercase tracking-wider"
            >
                <Trash2 size={14} className="mr-2" /> Delete
            </Button>
        </div>
    </div>
  );
}