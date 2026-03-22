// app/(HOME)/blog/studio/page.jsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BlogStudioClient from "./_components/BlogStudioClient";

export const metadata = {
  title: "Author Studio | Stark",
  description: "Manage your intelligence reports, drafts, and private feedback.",
};

export default async function BlogStudioPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch User's Blogs (Drafts & Published) WITH AUTHOR DATA
  const { data: myBlogs } = await supabase
    .from('blogs')
    .select('*, author:profiles!author_id(username, avatar_url, full_name, role)') // FIXED: Now we fetch the username!
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false });

  // 2. Fetch Saved Blogs
  const { data: savedData } = await supabase
    .from('blog_saves')
    .select('blog:blogs(*, author:profiles!author_id(username, avatar_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const savedBlogs = savedData?.map(s => s.blog) || [];

  // 3. Fetch Private Feedback (Comments marked 'private_to_author' on YOUR blogs)
  const { data: privateNotes } = await supabase
    .from('blog_comments')
    .select('*, user:profiles!user_id(username, avatar_url, full_name), blog:blogs(title, slug)')
    .eq('visibility', 'private_to_author')
    .order('created_at', { ascending: false });

  // Filter to only notes on blogs owned by this user
  const myBlogIds = myBlogs?.map(b => b.id) || [];
  const myPrivateNotes = privateNotes?.filter(note => myBlogIds.includes(note.blog_id)) || [];

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <BlogStudioClient 
        currentUser={user} 
        myBlogs={myBlogs || []} 
        savedBlogs={savedBlogs} 
        privateNotes={myPrivateNotes} 
      />
    </div>
  );
}