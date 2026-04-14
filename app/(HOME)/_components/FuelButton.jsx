// app/(HOME)/_components/FuelButton.jsx
"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SupportButton } from "@gurshaplus/sdk"; 
import { supabase } from "@/lib/supabaseClient";
import { logSupportTransaction } from "@/app/actions/logSupport";
import { toast } from "sonner";

export default function FuelButton({ creatorId, assetType, assetId }) {
  const [isFetchingLinks, setIsFetchingLinks] = useState(true);
  const [gurshaHandle, setGurshaHandle] = useState(null);

  // Fetch the creator's active Gursha link automatically
  useEffect(() => {
    const fetchLinks = async () => {
      if (!creatorId) return;
      const { data } = await supabase
        .from('creator_payment_links')
        .select('provider_handle')
        .eq('user_id', creatorId)
        .eq('provider_id', 'gursha')
        .maybeSingle();
      
      if (data?.provider_handle) {
          setGurshaHandle(data.provider_handle.trim());
      }
      setIsFetchingLinks(false);
    };
    fetchLinks();
  }, [creatorId]);

  if (isFetchingLinks) {
      return (
          <div className="w-full h-12 flex items-center justify-center border border-border bg-secondary/5 text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
          </div>
      );
  }

  if (!gurshaHandle) return null;

  const handleSuccess = async (transactionData) => {
    const toastId = toast.loading("Verifying Transaction...");
    
    const result = await logSupportTransaction({
        receiverId: creatorId,
        assetType: assetType, 
        assetId: assetId,
        provider: 'gursha',
        amount: transactionData?.amount || 0, 
        currency: 'ETB'
    });

    if (result.success) {
        toast.success("Injection Successful", { description: "Credits transferred to target node.", id: toastId });
    } else {
        toast.error("Telemetry Error", { description: "Payment succeeded, but logging failed.", id: toastId });
    }
  };

  return (
    <div className="w-full group">
        <SupportButton 
            creator={gurshaHandle} 
            variant="popup" 
            label="Fuel This Node" 
            emoji="⚡"
            onSuccess={handleSuccess}
            // Force inline styles just in case the SDK tries to inject its own
            style={{ 
                borderRadius: '0px', 
                backgroundColor: 'transparent' 
            }}
            // Use Tailwind's '!' modifier to force overrides
            className="w-full h-12 !bg-transparent !border !border-accent !text-accent hover:!bg-accent hover:!text-white !rounded-none font-mono text-[10px] uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)] hover:!shadow-none hover:translate-x-1 hover:translate-y-1 flex items-center justify-center gap-2"
        />
    </div>
  );
}