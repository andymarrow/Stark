"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Rocket, Loader2, Trophy, ShieldCheck, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/_context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validations";
import { submitToEvent } from "@/app/actions/submitToEvent";
import { getPublicFolders } from "@/app/actions/getPublicFolders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import CreateStepper from "./_components/CreateStepper";
import StepSource from "./_components/StepSource";
import StepDetails from "./_components/StepDetails";
import StepMedia from "./_components/StepMedia";
import StepReview from "./_components/StepReview";

// --- UTILS ---
const extractMentionIdentifiers = (text) => {
  if (!text) return [];
  const identifiers = new Set();
  const htmlRegex = /data-id=["']([^"']+)["']/g;
  let match;
  while ((match = htmlRegex.exec(text)) !== null) identifiers.add(match[1]);
  const labelRegex = /data-label=["']([^"']+)["']/g;
  while ((match = labelRegex.exec(text)) !== null) identifiers.add(match[1]);
  const mdLinkRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
  while ((match = mdLinkRegex.exec(text)) !== null) identifiers.add(match[1]);
  const strippedText = text.replace(/<[^>]*>/g, ' '); 
  const plainRegex = /(?:^|\s)@(\w+)/g;
  while ((match = plainRegex.exec(strippedText)) !== null) if (match[1].length > 2) identifiers.add(match[1]);
  return Array.from(identifiers);
};

function CreateForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestSlug = searchParams.get('contest');
  const eventToken = searchParams.get('event_token'); 

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [contestData, setContestData] = useState(null);
  const [eventData, setEventData] = useState(null); 
  const [publicFolders, setPublicFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      toast.error("Access Denied", { description: "You must be logged in to deploy." });
      return;
    }

    if (contestSlug) {
      const fetchContest = async () => {
        const { data } = await supabase
          .from('contests')
          .select('id, title')
          .eq('slug', contestSlug)
          .single();
        if (data) {
          setContestData(data);
          toast.info(`Joined: ${data.title}`, { description: "Your project will be submitted to this contest." });
        } else {
          toast.error("Contest Not Found");
        }
      };
      fetchContest();
    }

    if (eventToken) {
        const fetchEvent = async () => {
            const { data } = await supabase.rpc('get_event_by_token', { token_input: eventToken });
            if (data) {
                setEventData(data);
                toast.info(`Protocol: ${data.title}`, { description: "Submission channel open." });
                // Fetch Public Folders
                getPublicFolders(eventToken).then(folders => {
                    if (folders && folders.length > 0) setPublicFolders(folders);
                });
            } else {
                toast.error("Invalid Event Token");
            }
        };
        fetchEvent();
    }
  }, [user, loading, router, contestSlug, eventToken]);

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
      if (step === 1) projectSchema.pick({ type: true, link: true }).parse({ type: formData.type, link: formData.link });
      if (step === 2) projectSchema.pick({ title: true, description: true, demo_link: true }).parse({ title: formData.title, description: formData.description, demo_link: formData.demo_link });
      if (step === 3) projectSchema.pick({ files: true }).parse({ files: formData.files });
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
    if (formData.files.length > 0) score += 15;
    if (formData.demo_link) score += 25;
    return Math.min(100, score);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const processedImages = await Promise.all(formData.files.map(async (url) => {
        if (url.startsWith('blob:')) {
          const rawEntry = formData.rawFiles.find(r => r.preview === url);
          if (rawEntry && rawEntry.file) {
            const fileExt = rawEntry.file.name.split('.').pop();
            const fileName = `projects/${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, rawEntry.file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('project-assets').getPublicUrl(fileName);
            return data.publicUrl;
          }
        }
        return url;
      }));

      const tagArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
      const qualityScore = calculateQualityScore();

      // STATUS LOGIC: If submitting to contest/event, HIDE it initially.
      const initialStatus = (contestData || eventData) ? 'event_hidden' : 'published';

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
          status: initialStatus, // <--- UPDATED HERE
          quality_score: qualityScore,
          is_contest_entry: !!contestData 
        })
        .select()
        .single(); 

      if (projectError) throw projectError;

      if (contestData) {
        await supabase.from('contest_submissions').insert({ contest_id: contestData.id, project_id: projectData.id });
      }

      if (eventData) {
        await submitToEvent(eventToken, projectData.id, selectedFolder);
      }

      if (formData.collaborators && formData.collaborators.length > 0) {
        const collabRows = formData.collaborators.map(c => ({
          project_id: projectData.id,
          user_id: c.type === 'user' ? c.user_id : null,
          invite_email: c.type === 'ghost' ? c.email : null,
          status: 'pending' 
        }));
        await supabase.from('collaborations').insert(collabRows);
      }

      const extractedTokens = extractMentionIdentifiers(formData.description);
      if (extractedTokens.length > 0) {
        const { data: resolvedProfiles } = await supabase.from('profiles').select('id, username').in('username', extractedTokens);
        if (resolvedProfiles?.length > 0) {
          const mentionNotifications = resolvedProfiles.filter(p => p.id !== user.id).map(p => ({
              receiver_id: p.id,
              sender_id: user.id,
              type: 'system',
              message: `mentioned you in the project: ${formData.title}`,
              link: `/project/${slug}`,
              is_read: false
          }));
          if (mentionNotifications.length > 0) await supabase.from('notifications').insert(mentionNotifications);
        }
      }

      toast.success(contestData ? "Entry Submitted!" : eventData ? "Transmission Sent" : "Project Deployed");
      
      if (contestData) router.push(`/contests/${contestSlug}`);
      else if (eventData) router.push('/profile');
      else router.push(`/project/${slug}`);

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
        <div className="mb-12 text-center">
          {contestData ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full mb-4 animate-in fade-in slide-in-from-top-2">
              <Trophy size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">Submitting to {contestData.title}</span>
            </div>
          ) : eventData ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full mb-4 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">Target: {eventData.title}</span>
            </div>
          ) : (
            <p className="text-sm font-mono text-muted-foreground mb-2">// SYSTEM: READY_FOR_INPUT</p>
          )}
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Deploy <span className="text-accent">Project</span></h1>
        </div>

        <CreateStepper currentStep={step} />

        <div className="bg-card border border-border p-6 md:p-10 min-h-[400px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
          <div className="mb-8">
            {step === 1 && <StepSource data={formData} updateData={updateData} errors={errors} />}
            {step === 2 && (
                <>
                    <StepDetails data={formData} updateData={updateData} errors={errors} />
                    {eventData && publicFolders.length > 0 && (
                        <div className="mt-6 p-4 bg-secondary/5 border border-border">
                            <label className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                <FolderOpen size={14} /> Select Track / Category
                            </label>
                            <Select onValueChange={setSelectedFolder}>
                                <SelectTrigger className="w-full h-10 rounded-none bg-background border-border text-xs font-mono uppercase">
                                    <SelectValue placeholder="Choose Submission Node..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-border">
                                    {publicFolders.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </>
            )}
            {step === 3 && <StepMedia data={formData} updateData={updateData} errors={errors} />}
            {step === 4 && <StepReview data={formData} />}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-border border-dashed">
            <Button onClick={handleBack} disabled={step === 1 || isSubmitting} variant="ghost" className="font-mono uppercase text-xs tracking-widest hover:bg-transparent hover:text-accent disabled:opacity-30">
              <ArrowLeft size={14} className="mr-2" /> Back
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext} className="bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono uppercase text-xs tracking-widest h-12 px-8 transition-all">
                Next Step <ArrowRight size={14} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-accent text-white hover:bg-red-700 rounded-none font-mono uppercase text-xs tracking-widest h-12 px-8 shadow-[0_0_20px_rgba(220,38,38,0.5)] min-w-[160px]">
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <>{contestData || eventData ? "Submit Entry" : "Deploy Project"} <Rocket size={14} className="ml-2" /></>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <CreateForm />
    </Suspense>
  );
}