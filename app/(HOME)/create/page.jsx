"use client";
import { useState, useEffect, Suspense } from "react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Rocket, Loader2, Trophy } from "lucide-react";
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

// HELPER: Extract Mentions
const extractMentions = (text) => {
    if (!text) return [];
    // Regex to match @[display](username) pattern used by Mention extension
    const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]); // capturing group 1 is the username
    }
    return [...new Set(matches)]; // unique usernames
};

// Inner component to use searchParams
function CreateForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestSlug = searchParams.get('contest');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [contestData, setContestData] = useState(null);

  // Initialize form data
  const [formData, setFormData] = useState({
    type: 'code',
    link: '',
    demo_link: '',
    title: '',
    description: '',
    tags: '',
    files: [], 
    rawFiles: [], 
    collaborators: [], 
    readme: '', 
    stats: { stars: 0, forks: 0 } 
  });

  // Protect Route & Fetch Contest if param exists
  useEffect(() => {
    if (!loading && !user) {
        router.push('/login');
        toast.error("Access Denied", { description: "You must be logged in to deploy." });
        return;
    }

    // Fetch contest details if submitting to one
    if (contestSlug) {
        const fetchContest = async () => {
            const { data, error } = await supabase
                .from('contests')
                .select('id, title')
                .eq('slug', contestSlug)
                .single();
            
            if (data) {
                setContestData(data);
                toast.info(`Joined: ${data.title}`, { description: "Your project will be submitted to this contest." });
            } else {
                toast.error("Contest Not Found", { description: "Proceeding as normal project." });
            }
        };
        fetchContest();
    }
  }, [user, loading, router, contestSlug]);

  const updateData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
        setErrors(prev => {
            const newErrs = { ...prev };
            delete newErrs[key];
            return newErrs;
        });
    }
  };

  const handleNext = () => {
    setErrors({});
    try {
        if (step === 1) {
            projectSchema.pick({ type: true, link: true }).parse({ type: formData.type, link: formData.link });
        }
        if (step === 2) {
            projectSchema.pick({ title: true, description: true, demo_link: true }).parse({
                title: formData.title, description: formData.description, demo_link: formData.demo_link
            });
        }
        if (step === 3) {
            projectSchema.pick({ files: true }).parse({ files: formData.files });
        }
        if (step < 4) setStep(step + 1);
    } catch (err) {
        if (err.errors) {
            const newErrors = {};
            err.errors.forEach((e) => { newErrors[e.path[0]] = e.message; });
            setErrors(newErrors);
            toast.error("Validation Failed", { description: err.errors[0].message });
        }
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const calculateQualityScore = () => {
    let score = 10;
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
        // 1. Process Uploads
        const processedImages = await Promise.all(formData.files.map(async (url) => {
            if (url.startsWith('blob:')) {
                const rawEntry = formData.rawFiles.find(r => r.preview === url);
                if (rawEntry && rawEntry.file) {
                    const fileExt = rawEntry.file.name.split('.').pop();
                    const fileName = `projects/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, rawEntry.file);
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);
                    return publicUrl;
                }
            }
            return url;
        }));

        const tagArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
        const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
        const qualityScore = calculateQualityScore();

        // 2. Insert Project
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
                images: processedImages,
                thumbnail_url: processedImages[0] || null,
                status: 'published',
                quality_score: qualityScore,
                // FLAG AS CONTEST ENTRY IF APPLICABLE
                is_contest_entry: !!contestData
            })
            .select()
            .single(); 

        if (projectError) throw projectError;

        // 3. Link Contest Submission
        if (contestData) {
            const { error: contestError } = await supabase
                .from('contest_submissions')
                .insert({
                    contest_id: contestData.id,
                    project_id: projectData.id,
                });
            
            if (contestError) {
                console.error("Contest Link Error:", contestError);
                toast.error("Project saved, but failed to join contest.");
            }
        }

        // 4. Handle Collaborators
        if (formData.collaborators && formData.collaborators.length > 0) {
            const collabRows = formData.collaborators.map(c => ({
                project_id: projectData.id,
                user_id: c.type === 'user' ? c.user_id : null,
                invite_email: c.type === 'ghost' ? c.email : null,
                status: 'pending' 
            }));

            const { error: collabError } = await supabase.from('collaborations').insert(collabRows);

            if (collabError) {
                console.error("Collaborator DB Error:", collabError);
            } else {
                const ghostInvites = formData.collaborators.filter(c => c.type === 'ghost');
                ghostInvites.forEach(async (ghost) => {
                    const inviterName = user.user_metadata?.full_name || user.email;
                    await sendCollaboratorInvite(ghost.email, formData.title, inviterName);
                });
            }
        }

        // 5. HANDLE MENTIONS IN DESCRIPTION (The Fix)
        const mentionedUsernames = extractMentions(formData.description);
        
        if (mentionedUsernames.length > 0) {
            // Fetch IDs
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, username')
                .in('username', mentionedUsernames);

            if (usersData?.length > 0) {
                const notifications = usersData
                    .filter(u => u.id !== user.id)
                    .map(u => ({
                        receiver_id: u.id,
                        sender_id: user.id,
                        type: 'mention_in_project', // Distinct type for project mentions
                        message: `mentioned you in the documentation for '${formData.title}'.`,
                        link: `/project/${slug}`
                    }));

                await supabase.from('notifications').insert(notifications);
            }
        }

        toast.success(contestData ? "Entry Submitted!" : "Project Deployed", { 
            description: contestData ? `Joined ${contestData.title}` : `Quality Score: ${qualityScore}/100` 
        });
        
        // Redirect logic
        if (contestData) {
            router.push(`/contests/${contestSlug}`);
        } else {
            router.push(`/project/${slug}`);
        }

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
            {contestData ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full mb-4 animate-in fade-in slide-in-from-top-2">
                    <Trophy size={14} />
                    <span className="text-xs font-bold uppercase tracking-wide">Submitting to {contestData.title}</span>
                </div>
            ) : (
                <p className="text-sm font-mono text-muted-foreground mb-2">// SYSTEM: READY_FOR_INPUT</p>
            )}
            
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                Deploy <span className="text-accent">Project</span>
            </h1>
        </div>

        {/* Stepper */}
        <CreateStepper currentStep={step} />

        {/* Main Form Area */}
        <div className="bg-card border border-border p-6 md:p-10 min-h-[400px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />

            <div className="mb-8">
                {step === 1 && <StepSource data={formData} updateData={updateData} errors={errors} />}
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
                            <>{contestData ? "Submit Entry" : "Deploy Project"} <Rocket size={14} className="ml-2" /></>
                        )}
                    </Button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// Main Page Wrapper with Suspense
export default function CreatePage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <CreateForm />
        </Suspense>
    )
}