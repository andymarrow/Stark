"use client";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "SOURCE_LINK" },
  { id: 2, label: "CONFIGURATION" },
  { id: 3, label: "ASSETS" },
  { id: 4, label: "PRE_FLIGHT" },
];

export default function CreateStepper({ currentStep }) {
  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-border z-0" />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-background px-2">
              <div 
                className={`
                  w-8 h-8 flex items-center justify-center border transition-all duration-300
                  ${isActive 
                    ? "border-accent bg-accent text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" 
                    : isCompleted 
                        ? "border-foreground bg-foreground text-background" 
                        : "border-border bg-background text-muted-foreground"}
                `}
              >
                {isCompleted ? <Check size={14} /> : <span className="text-xs font-mono font-bold">0{step.id}</span>}
              </div>
              <span 
                className={`
                  absolute -bottom-6 text-[10px] font-mono tracking-widest whitespace-nowrap transition-colors duration-300
                  ${isActive ? "text-accent" : isCompleted ? "text-foreground" : "text-muted-foreground"}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}