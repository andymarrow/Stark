"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/_context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { sendCollaboratorInvite } from "@/app/actions/inviteCollaborator"; 
import { projectSchema } from "@/lib/validations"; 

import CreateStepper from "./_components/CreateStepper";
import StepSource from "./_components/StepSource";
import StepDetails from "./_components/StepDetails";
import StepMedia from "./_components/StepMedia";
import StepReview from "./_components/StepReview";

export default function CreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); 

  // Initialize form data with rawFiles for deferred upload
  const [formData, setFormData] = useState({
    type: 'code',
    link: '',
    demo_link: '',
    title: '',
    description: '',
    tags: '',
    files: [], // Stores Strings (URLs) for preview
    rawFiles: [], // NEW: Stores { preview: 'blob:..', file: File } for deferred upload
    collaborators: [], 
    readme: '', 
    stats: { stars: 0, forks: 0 } 
  });

  // Protect Route
  useEffect(() => {
    if (!loading && !user) {
        router.push('/login');
        toast.error("Access Denied", { description: "You must be logged in to deploy." });
    }
  }, [user, loading, router]);

  const updateData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for a field when user starts typing again
    if (errors[key]) {
        setErrors(prev => {
            const newErrs = { ...prev };
            delete newErrs[key];
            return newErrs;
        });
    }
  };

  const handleNext = () => {
    setErrors({}); // Reset errors before validating

    try {
        if (step === 1) {
            // Validate Source Link and Type
            projectSchema.pick({ type: true, link: true }).parse({
                type: formData.type,
                link: formData.link,
            });
        }
        
        if (step === 2) {
            // Validate Title, Description, and Demo Link
            projectSchema.pick({ title: true, description: true, demo_link: true }).parse({
                title: formData.title,
                description: formData.description,
                demo_link: formData.demo_link,
            });
        }

        if (step === 3) {
            // Validate that at least one image/video is uploaded
            projectSchema.pick({ files: true }).parse({
                files: formData.files,
            });
        }

        // If validation passes, move to next step
        if (step < 4) setStep(step + 1);

    } catch (err) {
        if (err.errors) {
            const newErrors = {};
            err.errors.forEach((e) => {
                newErrors[e.path[0]] = e.message;
            });
            setErrors(newErrors);
            
            // Show toast for the first error encountered
            toast.error("Validation Failed", { 
                description: err.errors[0].message 
            });
        }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const calculateQualityScore = () => {
    let score = 10; // Base score
    
    if (formData.description.length > 100) score += 10;
    if (formData.description.length > 500) score += 20;
    if (formData.files.length > 0) score += 15;
    if (formData.files.length > 2) score += 10;
    if (formData.demo_link) score += 25;
    if (formData.stats.stars > 10) score += 5;
    if (formData.stats.stars > 100) score += 5;

    return Math.min(100, score);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
        // --- 1. PROCESS UPLOADS (DEFERRED) ---
        // Iterate through 'files'. If it's a blob (local), upload now.
        // If it's a URL (video or auto-capture), keep as is.
        const processedImages = await Promise.all(formData.files.map(async (url) => {
            if (url.startsWith('blob:')) {
                // Find the actual file object matched by preview URL
                const rawEntry = formData.rawFiles.find(r => r.preview === url);
                
                if (rawEntry && rawEntry.file) {
                    const fileExt = rawEntry.file.name.split('.').pop();
                    // Unique filename to prevent collisions
                    const fileName = `projects/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('project-assets')
                        .upload(fileName, rawEntry.file);
                    
                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('project-assets')
                        .getPublicUrl(fileName);
                    
                    return publicUrl; // Replace blob with real Supabase URL
                }
            }
            return url; // Keep existing URL (YouTube, Auto-capture)
        }));

        const tagArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
        const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
        
        const qualityScore = calculateQualityScore();

        // --- 2. INSERT PROJECT ---
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert({
                owner_id: user.id,
                title: formData.title,
                slug: slug,
                description: formData.description,
                type: formData.type,
                source_link: formData.link,
                demo_link: formData.demo_link || null,
                tags: tagArray,
                images: processedImages, // Use the new array with real URLs
                thumbnail_url: processedImages[0] || null,
                status: 'published',
                quality_score: qualityScore,
            })
            .select()
            .single(); 

        if (projectError) throw projectError;

        // --- 3. HANDLE COLLABORATORS ---
        if (formData.collaborators && formData.collaborators.length > 0) {
            const collabRows = formData.collaborators.map(c => ({
                project_id: projectData.id,
                user_id: c.type === 'user' ? c.user_id : null,
                invite_email: c.type === 'ghost' ? c.email : null,
                status: 'pending' 
            }));

            const { error: collabError } = await supabase
                .from('collaborations')
                .insert(collabRows);

            if (collabError) {
                console.error("Collaborator DB Error:", collabError);
                toast.warning("Project Saved, but collaborators failed to link.");
            } else {
                // SEND EMAILS (Only for Ghosts)
                const ghostInvites = formData.collaborators.filter(c => c.type === 'ghost');
                ghostInvites.forEach(async (ghost) => {
                    const inviterName = user.user_metadata?.full_name || user.email;
                    await sendCollaboratorInvite(ghost.email, formData.title, inviterName);
                });
            }
        }

        toast.success("Project Deployed", { description: `Quality Score: ${qualityScore}/100` });
        router.push(`/project/${slug}`);

    } catch (error) {
        console.error(error);
        toast.error("Deployment Failed", { description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return null;

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
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />

            <div className="mb-8">
                {step === 1 && <StepSource data={formData} updateData={updateData} errors={errors} />}
                {/* Note: StepDetails now includes CollaboratorManager internally via props */}
                {step === 2 && <StepDetails data={formData} updateData={updateData} errors={errors} />}
                {step === 3 && <StepMedia data={formData} updateData={updateData} errors={errors} />}
                {step === 4 && <StepReview data={formData} />}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border border-dashed">
                <Button 
                    onClick={handleBack} 
                    disabled={step === 1 || isSubmitting}
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
                        disabled={isSubmitting}
                        className="bg-accent text-white hover:bg-accent/90 rounded-none font-mono uppercase text-xs tracking-widest h-12 px-8 shadow-[0_0_20px_rgba(220,38,38,0.5)] min-w-[160px]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <>Deploy Project <Rocket size={14} className="ml-2" /></>
                        )}
                    </Button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}