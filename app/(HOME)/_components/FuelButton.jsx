// app/(HOME)/_components/FuelButton.jsx
"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SupportButton } from "@gurshaplus/sdk"; 
import { supabase } from "@/lib/supabaseClient";
import { logSupportTransaction } from "@/app/actions/logSupport";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_context/AuthContext"; // <-- Added for Supporter ID

export default function FuelButton({ creatorId, assetType, assetId }) {
  const { user } = useAuth(); // <-- Get current logged-in user
  const router = useRouter();
  const [isFetchingLinks, setIsFetchingLinks] = useState(true);
  const [gurshaHandle, setGurshaHandle] = useState(null);

  // 1. Fetch the creator's active Gursha link automatically
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

  // --- 2. V1.1.0 SUCCESS HANDLER ---
  const handleSuccess = async (response) => {
    // Log the payload so we can see exactly what Gursha gives us in the browser console
    console.log("GURSHA_SUCCESS_PAYLOAD:", response); 
    
    const { status, donationId, donation } = response;
    const toastId = toast.loading("Validating Cryptographic Transfer...");

    // Safely extract the amount from the donation object
    const rawAmount = donation?.amount || 0;

    const result = await logSupportTransaction({
        supporterId: user?.id, // <-- Send the Supporter's ID securely
        receiverId: creatorId,
        assetType: assetType, 
        assetId: assetId,
        provider: 'gursha',
        amount: rawAmount, 
        currency: 'ETB',
        transactionId: donationId // Passing the unique ID to prevent duplicate logs
    });

    if (result.success) {
        toast.success("Injection Successful", { 
            description: `Node fueled with ${rawAmount} ETB.`, 
            id: toastId 
        });
        router.refresh(); // Refresh page to instantly update the Hype Matrix / Stats UI
    } else {
        toast.error("Telemetry Error", { 
            description: "Funds transferred, but ledger sync failed.", 
            id: toastId 
        });
    }
  };

  // --- 3. V1.1.0 ERROR/CANCEL HANDLER ---
  const handleFailed = (errorData) => {
     console.warn("GURSHA_FAILED_PAYLOAD:", errorData);
     toast.error("Transmission Aborted", { 
         description: errorData?.message || "Payment cancelled or rejected by gateway." 
     });
  };

  return (
    <div className="w-full group">
        <SupportButton 
            creator={gurshaHandle} 
            variant="popup" 
            label="Fuel This Node" 
            emoji="⚡"
            onSuccess={handleSuccess} 
            onFailed={handleFailed} 
            // Force inline styles to strip default border-radius
            style={{ borderRadius: '0px', backgroundColor: 'transparent' }}
            // Tailwind '!' overrides to force Stark Identity
            className="w-full h-12 !bg-transparent !border !border-accent !text-accent hover:!bg-accent hover:!text-white !rounded-none font-mono text-[10px] uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)] hover:!shadow-none hover:translate-x-1 hover:translate-y-1 flex items-center justify-center gap-2"
        />
    </div>
  );
}