"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateStepper from "./_components/CreateStepper";
import StepSource from "./_components/StepSource";
import StepDetails from "./_components/StepDetails";
import StepMedia from "./_components/StepMedia";
import StepReview from "./_components/StepReview";

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'code',
    link: '',
    title: '',
    description: '',
    tags: '',
    files: []
  });

  const updateData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Submit Logic here
    alert("Project Deployed!");
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Header */}
        <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                Deploy <span className="text-accent">Project</span>
            </h1>
            <p className="text-sm font-mono text-muted-foreground">
                // SYSTEM: READY_FOR_INPUT
            </p>
        </div>

        {/* Stepper */}
        <CreateStepper currentStep={step} />

        {/* Main Form Area */}
        <div className="bg-card border border-border p-6 md:p-10 min-h-[400px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />

            {/* Steps Rendering */}
            <div className="mb-8">
                {step === 1 && <StepSource data={formData} updateData={updateData} />}
                {step === 2 && <StepDetails data={formData} updateData={updateData} />}
                {step === 3 && <StepMedia data={formData} updateData={updateData} />}
                {step === 4 && <StepReview data={formData} />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-border border-dashed">
                <Button 
                    onClick={handleBack} 
                    disabled={step === 1}
                    variant="ghost" 
                    className="font-mono uppercase text-xs tracking-widest hover:bg-transparent hover:text-accent disabled:opacity-30"
                >
                    <ArrowLeft size={14} className="mr-2" /> Back
                </Button>

                {step < 4 ? (
                    <Button 
                        onClick={handleNext}
                        className="bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono uppercase text-xs tracking-widest h-12 px-8 transition-all"
                    >
                        Next Step <ArrowRight size={14} className="ml-2" />
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit}
                        className="bg-accent text-white hover:bg-accent/90 rounded-none font-mono uppercase text-xs tracking-widest h-12 px-8 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                    >
                        Deploy Project <Rocket size={14} className="ml-2" />
                    </Button>
                )}
            </div>

        </div>

      </div>
    </div>
  );
}