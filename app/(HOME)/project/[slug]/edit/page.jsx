"use client";
import { useEffect, useState, use } from "react";
import { useRouter, notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Loader2 } from "lucide-react";
import EditProjectForm from "./_components/EditProjectForm";

export default function EditProjectPage({ params }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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
        
        // Fetch project and owner_id
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
           notFound(); // Show 404 if project doesn't exist
           return;
        }

        // SECURITY CHECK: Only owner can edit
        if (data.owner_id !== user.id) {
            router.push(`/project/${slug}`); // Kick them back to view mode
            return;
        }

        // Format for form (handle techStack mapping if needed)
        // Here we assume your DB 'tags' is a string array. 
        // If your EditForm expects objects, map them here.
        // Based on my previous EditProjectForm code, it handles raw arrays or objects.
        const formattedProject = {
            ...data,
            techStack: data.tags || [] // Ensuring it's an array
        };

        setProject(formattedProject);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug, user, authLoading, router]);

  if (loading || authLoading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );
  }

  if (!project) return null; // Should have redirected or 404'd

  return (
    <div className="min-h-screen bg-background pt-8 px-4">
      <EditProjectForm project={project} />
    </div>
  );
}