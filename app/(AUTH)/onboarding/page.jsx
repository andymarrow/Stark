"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, PenTool, Film, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthShell from "../_components/AuthShell";
import AuthForm from "../_components/AuthForm";

// --- CONFIGURATION DATA ---
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: "",
    stack: []
  });

  // Step 1 is handled by AuthForm (Credentials), Step 2 & 3 are custom here.

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

  return (
    <AuthShell 
        title={step === 1 ? "Initialize Account" : step === 2 ? "Select Class" : "System Config"}
        subtitle={step === 1 ? "Create your credentials to join the network." : step === 2 ? "Define your primary function." : "Select your active toolset."}
    >
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? "bg-accent" : "bg-border"}`} />
            ))}
        </div>

        {/* --- STEP 1: CREDENTIALS --- */}
        {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <AuthForm view="signup" />
                {/* 
                   In a real app, AuthForm would accept an onSubmit prop. 
                   For this demo, we mock the transition button below 
                */}
                <div className="mt-4 pt-4 border-t border-dashed border-border">
                    <Button 
                        onClick={() => setStep(2)} 
                        className="w-full h-12 bg-secondary/20 hover:bg-secondary/40 text-foreground rounded-none font-mono text-xs uppercase"
                    >
                        [DEMO] Skip to Setup <ArrowRight size={14} className="ml-2" />
                    </Button>
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
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-none border-border">
                        Back
                    </Button>
                    <Button 
                        onClick={() => setStep(3)} 
                        disabled={!formData.role}
                        className="flex-[2] h-12 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono uppercase tracking-widest text-xs"
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
                        onClick={() => alert("Setup Complete! Redirecting...")} 
                        className="flex-[2] h-12 bg-accent text-white hover:bg-accent/90 rounded-none font-mono uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                        Complete Setup
                    </Button>
                </div>
            </div>
        )}

    </AuthShell>
  );
}