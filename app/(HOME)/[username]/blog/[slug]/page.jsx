// app/(HOME)/[username]/blog/[slug]/page.jsx
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image"; 
import BlogReader from "../_components/BlogReader";
import { Loader2 } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// --- DYNAMIC METADATA (SEO & SOCIAL CARDS) ---
export async function generateMetadata({ params }) {
  const { username, slug } = await params;
  
  // 1. Safe Domain Fallback
  // Replace "https://stark.et" with your ACTUAL production domain if it differs.
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et"; 
  
  try {
    const supabase = await createClient();

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('title, excerpt, cover_image')
      .eq('slug', slug)
      .single();

    if (error || !blog) return { title: "Report Not Found | Stark" };

    // Point to our specialized Intelligence OG API
    const ogUrl = `${BASE_URL}/api/og/blog?slug=${encodeURIComponent(slug)}`;

    const pageTitle = `${blog.title} | Stark Intel`;
    const pageDesc = blog.excerpt || `Read this intelligence report by @${username} on the Stark network.`;
    const canonicalUrl = `${BASE_URL}/${username}/blog/${slug}`;

    return {
      title: pageTitle,
      description: pageDesc,
      alternates: { canonical: canonicalUrl },
      openGraph: {
          title: pageTitle,
          description: pageDesc,
          url: canonicalUrl,
          siteName: 'Stark Network',
          images: [{ url: ogUrl, width: 1200, height: 630, alt: blog.title }],
          type: 'article',
      },
      twitter: {
          card: 'summary_large_image',
          title: pageTitle,
          description: pageDesc,
          images: [ogUrl],
      }
    };
  } catch (err) {
    console.error("Metadata Generation Error:", err);
    return { title: "Stark Intelligence Network" };
  }
}

// --- 1. STARK THEMED SKELETON LOADER ---
function BlogSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-32 animate-pulse">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-3xl mx-auto">
          
          {/* SKELETON: Author Meta */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-secondary/40 border border-border" />
            <div className="space-y-3">
              <div className="h-4 w-40 bg-secondary/40" />
              <div className="h-2 w-56 bg-secondary/20" />
            </div>
          </div>

          {/* SKELETON: Title */}
          <div className="space-y-4 mb-10">
            <div className="h-10 md:h-14 w-full bg-secondary/40" />
            <div className="h-10 md:h-14 w-4/5 bg-secondary/40" />
          </div>

          {/* SKELETON: Toolbar */}
          <div className="h-16 w-full border-y border-border bg-secondary/10 mb-12 flex items-center justify-between px-6">
             <div className="flex gap-6">
                <div className="h-4 w-8 bg-secondary/40" />
                <div className="h-4 w-8 bg-secondary/40" />
                <div className="h-4 w-8 bg-secondary/40" />
             </div>
             <div className="flex gap-4">
                <div className="h-6 w-24 bg-secondary/40" />
                <div className="h-6 w-8 bg-secondary/40" />
             </div>
          </div>

          {/* SKELETON: Cover Image */}
          <div className="w-full aspect-[16/9] md:aspect-[21/9] border border-border bg-secondary/10 mb-12 relative flex items-center justify-center overflow-hidden">
              <div className="flex flex-col items-center gap-4 text-muted-foreground/30">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">Decrypting_Asset...</span>
              </div>
              <div className="absolute bottom-4 left-4 h-5 w-24 bg-secondary/30" />
          </div>

          {/* SKELETON: Content Lines */}
          <div className="space-y-4">
            <div className="h-4 w-full bg-secondary/20" />
            <div className="h-4 w-full bg-secondary/20" />
            <div className="h-4 w-11/12 bg-secondary/20" />
            <div className="h-4 w-full bg-secondary/20" />
            <div className="h-4 w-4/5 bg-secondary/20" />
            
            <div className="h-8 w-1/3 bg-secondary/30 mt-10 mb-6" />
            
            <div className="h-4 w-full bg-secondary/20" />
            <div className="h-4 w-10/12 bg-secondary/20" />
            <div className="h-4 w-full bg-secondary/20" />
          </div>

        </div>
      </div>
    </div>
  );
}

// --- 2. THE DATA FETCHING COMPONENT ---
async function BlogContent({ username, slug }) {
  const supabase = await createClient();

  // 1. Get Current Authenticated User
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 2. Fetch Author Profile
  const { data: author, error: authorError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (authorError || !author) return notFound();

  // 3. Fetch Core Blog Data
  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('author_id', author.id)
    .single();

  if (blogError || !blog) return notFound();

  // 4. Security Clearance: Only author can view non-published reports
  if (blog.status !== 'published' && currentUser?.id !== author.id) {
    return notFound();
  }

  // 5. Fetch ALL versions (Ordered newest to oldest for the time-travel dropdown)
  const { data: versions, error: versionError } = await supabase
    .from('blog_versions')
    .select('*')
    .eq('blog_id', blog.id)
    .order('version_number', { ascending: false });

  if (versionError || !versions || versions.length === 0) return notFound();

  // --- ALGORITHM: FETCH RELATED INTELLIGENCE ---
  
  // A. Author's Archive (Other posts by same user)
  const { data: authorMore } = await supabase
    .from('blogs')
    .select('id, title, slug, cover_image, reading_time, published_at')
    .eq('author_id', author.id)
    .eq('status', 'published')
    .neq('id', blog.id)
    .order('published_at', { ascending: false })
    .limit(2);

  // B. Network Intel (Related by shared Tags)
  let networkRelated = [];
  if (blog.tags && blog.tags.length > 0) {
      const { data: networkData } = await supabase
        .from('blogs')
        .select('id, title, slug, cover_image, reading_time, published_at, author:profiles!author_id(username, avatar_url)')
        .eq('status', 'published')
        .neq('author_id', author.id)
        .overlaps('tags', blog.tags) 
        .order('views', { ascending: false })
        .limit(2);
        
      networkRelated = networkData || [];
  }

  // Fallback: If no tags match, grab trending reports from the network
  if (networkRelated.length === 0) {
      const { data: trendingData } = await supabase
        .from('blogs')
        .select('id, title, slug, cover_image, reading_time, published_at, author:profiles!author_id(username, avatar_url)')
        .eq('status', 'published')
        .neq('author_id', author.id)
        .order('likes_count', { ascending: false })
        .limit(2);
        
      networkRelated = trendingData || [];
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-32">
      
      {/* THE MAIN INTERACTIVE READER */}
      <BlogReader 
        blog={blog} 
        versions={versions} 
        author={author} 
        currentUser={currentUser} 
      />

      {/* --- FOOTER: RELATED INTELLIGENCE SECTION --- */}
      <div className="container mx-auto px-4 max-w-7xl mt-32 border-t border-border pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              
              {/* Left Column: Author Archive */}
              <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-accent" /> More from @{author.username}
                  </h4>
                  <div className="flex flex-col gap-6">
                      {authorMore?.length > 0 ? authorMore.map(post => (
                          <RelatedCard key={post.id} post={post} author={author} />
                      )) : (
                          <div className="text-[10px] font-mono uppercase text-muted-foreground border border-dashed border-border p-6 text-center">
                              No additional records found in node history.
                          </div>
                      )}
                  </div>
              </div>

              {/* Right Column: Global Network Intel */}
              <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500" /> Network Intelligence
                  </h4>
                  <div className="flex flex-col gap-6">
                      {networkRelated?.length > 0 ? networkRelated.map(post => (
                          <RelatedCard key={post.id} post={post} author={post.author} isNetwork />
                      )) : (
                          <div className="text-[10px] font-mono uppercase text-muted-foreground border border-dashed border-border p-6 text-center">
                              Network scan complete. Zero related signals.
                          </div>
                      )}
                  </div>
              </div>

          </div>
      </div>

    </div>
  );
}

// --- 3. THE MAIN PAGE WRAPPER ---
// We wrap our data fetching component in a Suspense boundary and pass our custom Skeleton
export default async function BlogDetailPage({ params }) {
  const { username, slug } = await params;

  return (
    <Suspense fallback={<BlogSkeleton />}>
      <BlogContent username={username} slug={slug} />
    </Suspense>
  );
}

// --- SUB-COMPONENT: STARK-STYLED RELATED CARD ---
function RelatedCard({ post, author, isNetwork }) {
    return (
        <a 
            href={`/${author.username}/blog/${post.slug}`} 
            className="group flex gap-4 p-3 border border-transparent hover:border-border hover:bg-secondary/5 transition-all duration-300"
        >
            <div className="w-24 h-16 bg-zinc-950 border border-border relative overflow-hidden shrink-0">
                {post.cover_image ? (
                    <Image 
                        src={post.cover_image} 
                        alt={post.title} 
                        fill 
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-[8px] text-zinc-600 tracking-widest bg-secondary/10">
                        NO_ASSET
                    </div>
                )}
            </div>
            
            <div className="flex flex-col justify-between py-0.5 min-w-0">
                <h5 className="font-bold text-sm uppercase tracking-tight truncate group-hover:text-accent transition-colors">
                    {post.title}
                </h5>
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground uppercase tracking-tighter">
                    {isNetwork && <span className="text-foreground font-bold">@{author.username}</span>}
                    {isNetwork && <span className="opacity-30">|</span>}
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    <span className="opacity-30">|</span>
                    <span className="text-accent">{post.reading_time || 5} MIN</span>
                </div>
            </div>
        </a>
    );
}