"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code2, PenTool, Film, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthShell from "../_components/AuthShell";
import AuthForm from "../_components/AuthForm";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";

const ROLES = [
    { id: "dev", label: "Developer", icon: Code2, desc: "I ship code & architecture." },
    { id: "design", label: "Designer", icon: PenTool, desc: "I craft UI/UX & systems." },
    { id: "motion", label: "Motion", icon: Film, desc: "I animate & edit video." },
];

const STACKS = [
    "React", "Vue", "Next.js", "Svelte", "Node.js", "Go", "Rust", 
    "Python", "Figma", "Blender", "After Effects", "Docker", "AWS", "Tailwind"
];

export default function OnboardingPage() {
  const { user, loading } = useAuth(); // Check if user is logged in
  const router = useRouter();
  
  // Default to step 1
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    role: "",
    stack: []
  });

  // --- AUTO-SKIP LOGIC ---
  // If the user lands here and is ALREADY logged in (e.g. from Email Link),
  // skip the signup form and go straight to Role Selection (Step 2).
  useEffect(() => {
    if (!loading && user) {
        setStep(2);
    }
  }, [user, loading]);

  const handleRoleSelect = (roleId) => {
    setFormData({ ...formData, role: roleId });
  };

  const handleStackToggle = (tech) => {
    setFormData(prev => ({
        ...prev,
        stack: prev.stack.includes(tech) 
            ? prev.stack.filter(t => t !== tech)
            : [...prev.stack, tech]
    }));
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                role: formData.role, 
                // Store stack in bio for now, or add a 'tech_stack' column to your profiles table
                bio: `Role: ${formData.role} | Stack: ${formData.stack.join(', ')}` 
            })
            .eq('id', user.id);

        if (error) throw error;

        toast.success("Profile Configured");
        router.push("/profile");

    } catch (error) {
        toast.error("Save Failed", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  // If loading auth state, show nothing or spinner to prevent flickering
  if (loading) {
      return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" /></div>;
  }

  // Dynamic Titles based on step
  const getTitle = () => {
      if (step === 1) return "Initialize Account";
      if (step === 2) return "Select Class";
      return "System Config";
  };

  const getSubtitle = () => {
      if (step === 1) return "Create your credentials to join the network.";
      if (step === 2) return "Define your primary function.";
      return "Select your active toolset.";
  };

  return (
    <AuthShell 
        title={getTitle()}
        subtitle={getSubtitle()}
    >
        
        {/* Progress Dots - Only show if we are actually in the setup phase (Step 2+) */}
        {step > 1 && (
            <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? "bg-accent" : "bg-border"}`} />
                ))}
            </div>
        )}

        {/* --- STEP 1: CREDENTIALS (Only shown if NOT logged in) --- */}
        {step === 1 && !user && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <AuthForm view="signup" />
                <div className="mt-4 pt-4 border-t border-dashed border-border text-center">
                    <p className="text-xs text-muted-foreground">
                        Already have an account? <span className="text-foreground cursor-pointer hover:underline font-bold" onClick={() => router.push('/login')}>Login</span>
                    </p>
                </div>
            </div>
        )}

        {/* --- STEP 2: ROLE SELECTION --- */}
        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 gap-3">
                    {ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => handleRoleSelect(role.id)}
                            className={`
                                flex items-center gap-4 p-4 border text-left transition-all duration-200 group
                                ${formData.role === role.id 
                                    ? "border-accent bg-accent/5" 
                                    : "border-border hover:border-foreground/50 bg-background"}
                            `}
                        >
                            <div className={`p-2 ${formData.role === role.id ? "bg-accent text-white" : "bg-secondary text-muted-foreground group-hover:text-foreground"}`}>
                                <role.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{role.label}</h3>
                                <p className="text-xs text-muted-foreground font-mono">{role.desc}</p>
                            </div>
                            {formData.role === role.id && <Check size={16} className="ml-auto text-accent" />}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 mt-8">
                    {/* Back button disabled in step 2 because going back to step 1 (signup) makes no sense if logged in */}
                    <Button 
                        onClick={() => setStep(3)} 
                        disabled={!formData.role}
                        className="w-full h-12 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono uppercase tracking-widest text-xs"
                    >
                        Next Step
                    </Button>
                </div>
            </div>
        )}

        {/* --- STEP 3: TECH STACK --- */}
        {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex flex-wrap gap-2">
                    {STACKS.map((tech) => {
                        const isSelected = formData.stack.includes(tech);
                        return (
                            <button
                                key={tech}
                                onClick={() => handleStackToggle(tech)}
                                className={`
                                    px-3 py-2 text-xs font-mono border transition-all duration-200
                                    ${isSelected 
                                        ? "bg-foreground text-background border-foreground" 
                                        : "bg-background border-border text-muted-foreground hover:border-accent hover:text-accent"}
                                `}
                            >
                                {tech}
                            </button>
                        )
                    })}
                </div>
                
                <div className="p-4 bg-secondary/10 border border-border text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{formData.stack.length}</span> technologies selected.
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-none border-border">
                        Back
                    </Button>
                    <Button 
                        onClick={handleComplete} 
                        disabled={isSaving}
                        className="flex-[2] h-12 bg-accent text-white hover:bg-accent/90 rounded-none font-mono uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : "Complete Setup"}
                    </Button>
                </div>
            </div>
        )}

    </AuthShell>
  );
}