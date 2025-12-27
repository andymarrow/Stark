"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditProjectForm from "./_components/EditProjectForm";

export default function EditProjectPage({ params }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    // If no user, redirect to login
    if (!user) {
        router.push("/login");
        return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
           notFound(); 
           return;
        }

        // SECURITY CHECK: Verify Ownership
        if (data.owner_id !== user.id) {
            setIsUnauthorized(true);
            setLoading(false);
            return;
        }

        const formattedProject = {
            ...data,
            techStack: data.tags || []
        };

        setProject(formattedProject);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    
  }, [slug, user?.id, authLoading, router]);

  if (loading || authLoading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );
  }

  // --- 403 UNAUTHORIZED STATE ---
  if (isUnauthorized) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-full mb-6">
                <ShieldAlert size={48} className="text-red-500" />
            </div>
            
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tight">Access Forbidden // 403</h1>
                <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
                    Security protocol engaged. You do not possess the cryptographic keys to modify this project node.
                </p>
            </div>

            <div className="flex gap-4">
                <Link href={`/project/${slug}`}>
                    <Button variant="outline" className="h-12 rounded-none border-border font-mono text-xs uppercase tracking-wider">
                        <ArrowLeft size={14} className="mr-2" /> Return to Viewer
                    </Button>
                </Link>
                <Link href="/profile">
                    <Button className="h-12 bg-foreground text-background hover:bg-accent hover:text-white rounded-none font-mono text-xs uppercase tracking-wider">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
  }

  if (!project) return null;

  
  return (
    <div className="min-h-screen bg-background pt-8 px-4">
      <EditProjectForm project={project} />
    </div>
  );
}