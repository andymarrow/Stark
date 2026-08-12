"use client";
/**
 * Stark Voice Assistant (Voxide integration)
 * ------------------------------------------
 * Capability-first voice/text control for the whole platform. The agent calls
 * the real functions below when a user speaks or types — navigate anywhere,
 * search the index, read notifications, filter Explore, message someone, start
 * a project, switch theme, sign out.
 *
 * NOTE ON SSR: @voxide/react's VoxideClient constructor reads
 * window.localStorage without a guard, so it must only be constructed in the
 * browser. We build it lazily inside an effect (getClient) — never at module
 * scope — which keeps Next.js server rendering happy and avoids hydration
 * mismatches.
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { VoxideClient, VoxideWidget } from "@voxide/react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { deliverVoiceCommand, emitVoiceCommand } from "@/lib/voiceBridge";

// Publishable key — safe to ship in the browser. Env override wins so this can
// differ per environment without a code change.
const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VOXIDE_PUBLIC_KEY ||
  "vox_pub_f8c1304fd1d5252f8ab0da0143c7eae150e5ce5f8cecaaca";

// Live bridge from React-only values (router, theme, auth) to the module-scope
// capability handlers. The component keeps these fresh on every render.
const ctx = {
  router: null,
  pathname: "/",
  setTheme: null,
  user: null,
  signOut: null,
};

// Friendly destination -> route. Powers the `navigate` capability and mirrors
// exactly what the navbar / command palette expose.
const ROUTES = {
  home: "/",
  explore: "/explore",
  trending: "/trending",
  contests: "/contests",
  "create contest": "/contests/create",
  events: "/events",
  blog: "/blog",
  blogs: "/blog",
  "blog studio": "/blog/studio",
  "write blog": "/blog/write",
  messages: "/chat",
  chat: "/chat",
  create: "/create",
  "new project": "/create",
  profile: "/profile",
  notifications: "/profile?view=notifications",
  settings: "/profile?view=settings",
  announcements: "/announcements",
  dashboard: "/dashboard",
  about: "/about",
  login: "/login",
};

// ---- helpers ----------------------------------------------------------------

function go(route) {
  if (ctx.router?.push) ctx.router.push(route);
  else if (typeof window !== "undefined") window.location.href = route;
  return route;
}

const like = (s) => `%${String(s ?? "").trim()}%`;

// Tally rows by a key (e.g. count badges per user_id). Returns [[id, count], ...] desc.
function topCounts(rows, key, n = 5) {
  const counts = new Map();
  for (const r of rows || []) {
    const id = r?.[key];
    if (id == null) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

// Sum a numeric field by a key (e.g. total project views per owner_id). Returns [[id, sum], ...] desc.
function topSums(rows, key, valKey, n = 5) {
  const sums = new Map();
  for (const r of rows || []) {
    const id = r?.[key];
    if (id == null) continue;
    sums.set(id, (sums.get(id) || 0) + (Number(r?.[valKey]) || 0));
  }
  return [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

// ---- capability registry ----------------------------------------------------

function registerCapabilities(ai) {
  ai.register({
    // === Navigation ========================================================
    navigate: {
      description:
        "Go to any page on Stark. Use `destination` for a known section, or `path` for an exact route like /project/my-slug. Known sections: home, explore, trending, contests, events, blog, chat, messages, create, profile, notifications, settings, announcements, dashboard, login. (chat and messages both open the DM page.) IMPORTANT: 'trending' is its own page (/trending) — never send it to Explore. Use this (not search) for any request to open a section.",
      params: {
        destination: {
          type: "string",
          description: "A known section of the app.",
          enum: Object.keys(ROUTES),
        },
        path: {
          type: "string",
          description: "An exact route path, used when destination doesn't fit.",
        },
      },
      handler: async ({ destination, path }) => {
        let route = path;
        if (!route && destination) {
          const key = String(destination).toLowerCase().trim();
          // Tolerate compound/heard-as-one destinations like "chat/messages".
          route = ROUTES[key] || ROUTES[destination] || ROUTES[key.split(/[/\s]+/)[0]];
        }
        if (!route) {
          return {
            status: "unknown_destination",
            message: `I don't know how to open "${destination}".`,
            known: Object.keys(ROUTES),
          };
        }
        return { status: "ok", opened: go(route) };
      },
    },

    goBack: {
      description: "Go back to the previous page.",
      handler: async () => {
        if (typeof window !== "undefined") window.history.back();
        return { status: "ok" };
      },
    },

    login: {
      description:
        "Open the login / sign-in page so the user can sign in. Use this whenever the user says 'log in', 'sign in', or 'log me in'. (You can't submit credentials for them — this just takes them to the login screen.)",
      handler: async () => ({ status: "ok", opened: go("/login") }),
    },

    scrollPage: {
      description:
        "Scroll the current page. direction: 'down' or 'up' moves by roughly one screen; 'top' or 'bottom' jumps to the ends.",
      params: {
        direction: {
          type: "string",
          required: true,
          description: "Where to scroll.",
          enum: ["down", "up", "top", "bottom"],
        },
        amount: {
          type: "number",
          description: "Fraction of the viewport to move for up/down (default 0.9).",
        },
      },
      handler: async ({ direction, amount }) => {
        if (typeof window === "undefined") return { status: "error", message: "No window." };
        const frac = typeof amount === "number" && amount > 0 ? amount : 0.9;
        const dy = window.innerHeight * frac;
        const maxY = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        if (direction === "top") window.scrollTo({ top: 0, behavior: "smooth" });
        else if (direction === "bottom") window.scrollTo({ top: maxY, behavior: "smooth" });
        else window.scrollBy({ top: direction === "up" ? -dy : dy, behavior: "smooth" });
        return { status: "ok", direction };
      },
    },

    // === Search & open =====================================================
    search: {
      description:
        "Search Stark's index for people, projects, contests, and blog posts by keyword or title. Returns matches; each has an `open` path you can navigate to. Do NOT use this to open a section like Explore, Trending, or Contests — use navigate for those. To see one specific person's own projects, prefer openProfile.",
      params: {
        query: { type: "string", required: true, description: "What to search for." },
        type: {
          type: "string",
          description: "Limit the search to one kind of result.",
          enum: ["all", "users", "projects", "contests", "blogs"],
        },
      },
      handler: async ({ query, type = "all" }) => {
        const q = like(query);
        const limit = type === "all" ? 4 : 10;
        const tasks = [];

        if (type === "all" || type === "users")
          tasks.push(
            supabase
              .from("profiles")
              .select("username, full_name, avatar_url")
              .or(`username.ilike.${q},full_name.ilike.${q}`)
              .limit(limit)
              .then(({ data }) => [
                "users",
                (data || []).map((u) => ({
                  name: u.full_name || u.username,
                  username: u.username,
                  open: `/profile/${u.username}`,
                })),
              ])
          );

        if (type === "all" || type === "projects")
          tasks.push(
            supabase
              .from("projects")
              .select("title, slug, type")
              .ilike("title", q)
              .eq("status", "published")
              .limit(limit)
              .then(({ data }) => [
                "projects",
                (data || []).map((p) => ({ name: p.title, kind: p.type, open: `/project/${p.slug}` })),
              ])
          );

        if (type === "all" || type === "contests")
          tasks.push(
            supabase
              .from("contests")
              .select("title, slug")
              .ilike("title", q)
              .eq("is_public", true)
              .limit(limit)
              .then(({ data }) => [
                "contests",
                (data || []).map((c) => ({ name: c.title, open: `/contests/${c.slug}` })),
              ])
          );

        if (type === "all" || type === "blogs")
          tasks.push(
            supabase
              .from("blogs")
              .select("title, slug, author:profiles!author_id(username)")
              .ilike("title", q)
              .eq("status", "published")
              .limit(limit)
              .then(({ data }) => [
                "blogs",
                (data || []).map((b) => ({
                  name: b.title,
                  open: b.author?.username ? `/${b.author.username}/blog/${b.slug}` : undefined,
                })),
              ])
          );

        const entries = await Promise.all(tasks);
        const results = Object.fromEntries(entries);
        const total = entries.reduce((n, [, arr]) => n + arr.length, 0);
        return {
          status: "ok",
          query,
          total,
          results,
          hint: total
            ? "To open one, call navigate with its `open` path."
            : "No matches found.",
        };
      },
    },

    openProfile: {
      description:
        "Open a user's profile by username or name — their profile page lists all the projects they've created, so use this when asked to see a specific person's projects or work. Say 'my profile' or 'me' to open your own.",
      params: { username: { type: "string", required: true, description: "Username or display name, or 'me'." } },
      handler: async ({ username }) => {
        const raw = String(username || "").replace(/^@/, "").trim();
        if (!raw || /^(me|my|myself|my profile)$/i.test(raw)) {
          return { status: "ok", opened: go("/profile") };
        }
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .or(`username.ilike.${raw},full_name.ilike.${like(raw)}`)
          .limit(1);
        const uname = data?.[0]?.username || raw;
        return { status: "ok", opened: go(`/profile/${uname}`) };
      },
    },

    openProject: {
      description: "Find a project by title and open it.",
      params: { title: { type: "string", required: true } },
      handler: async ({ title }) => {
        const { data } = await supabase
          .from("projects")
          .select("title, slug")
          .ilike("title", like(title))
          .eq("status", "published")
          .limit(1);
        if (!data?.length) return { status: "not_found", message: `No project matching "${title}".` };
        return { status: "ok", opened: go(`/project/${data[0].slug}`), title: data[0].title };
      },
    },

    openContest: {
      description: "Find a contest by title and open it.",
      params: { title: { type: "string", required: true } },
      handler: async ({ title }) => {
        const { data } = await supabase
          .from("contests")
          .select("title, slug")
          .ilike("title", like(title))
          .eq("is_public", true)
          .limit(1);
        if (!data?.length) return { status: "not_found", message: `No contest matching "${title}".` };
        return { status: "ok", opened: go(`/contests/${data[0].slug}`), title: data[0].title };
      },
    },

    // === Analytics / leaderboards =========================================
    topProjects: {
      description:
        "Find the top projects by 'views' or 'stars' (likes). scope 'mine' = only the signed-in user's own projects (use for 'my most-viewed project'); 'all' = the whole platform. Set open=true to jump straight to the #1 project.",
      params: {
        metric: { type: "string", description: "Ranking metric.", enum: ["views", "stars"] },
        scope: { type: "string", description: "Whose projects.", enum: ["mine", "all"] },
        open: { type: "boolean", description: "Open the #1 project." },
      },
      handler: async ({ metric = "views", scope = "all", open = false }) => {
        const col = metric === "stars" ? "likes_count" : "views";
        if (scope === "mine" && !ctx.user)
          return { status: "unauthenticated", message: "Sign in to see your own projects." };
        let q = supabase
          .from("projects")
          .select("title, slug, views, likes_count, owner_id")
          .eq("status", "published");
        if (scope === "mine") q = q.eq("owner_id", ctx.user.id);
        const { data } = await q.order(col, { ascending: false }).limit(open ? 1 : 5);
        if (!data?.length)
          return {
            status: "not_found",
            message: scope === "mine" ? "You have no published projects yet." : "No projects found.",
          };
        const top = data.map((p) => ({
          name: p.title,
          views: p.views,
          stars: p.likes_count,
          open: `/project/${p.slug}`,
        }));
        if (open) go(top[0].open);
        return { status: "ok", scope, metric, top, opened: open ? top[0].open : undefined };
      },
    },

    topBlogs: {
      description:
        "Find the best-performing blog posts by 'views' or 'stars' (likes). Set open=true to open the #1 post — use this for 'open the best performing blog'.",
      params: {
        metric: { type: "string", description: "Ranking metric.", enum: ["views", "stars"] },
        open: { type: "boolean", description: "Open the #1 blog post." },
      },
      handler: async ({ metric = "views", open = false }) => {
        const col = metric === "stars" ? "likes_count" : "views";
        const { data } = await supabase
          .from("blogs")
          .select("title, slug, views, likes_count, author:profiles!author_id(username)")
          .eq("status", "published")
          .order(col, { ascending: false })
          .limit(open ? 1 : 5);
        if (!data?.length) return { status: "not_found", message: "No published blogs found." };
        const top = data.map((b) => ({
          name: b.title,
          views: b.views,
          stars: b.likes_count,
          open: b.author?.username ? `/${b.author.username}/blog/${b.slug}` : undefined,
        }));
        if (open && top[0].open) go(top[0].open);
        return { status: "ok", metric, top, opened: open ? top[0]?.open : undefined };
      },
    },

    topUsers: {
      description:
        "Rank users across all of Stark by a metric: 'badges' (most achievements unlocked), 'views' (highest total views across their published projects), or 'followers' (most followed). Set open=true to open the #1 user's profile. Use for questions like 'who has the most badges' or 'which creator has the most views'.",
      params: {
        metric: { type: "string", required: true, description: "How to rank users.", enum: ["badges", "views", "followers"] },
        open: { type: "boolean", description: "Open the #1 user's profile." },
      },
      handler: async ({ metric, open = false }) => {
        const rpcName =
          metric === "badges"
            ? "get_top_users_by_badges"
            : metric === "followers"
            ? "get_top_users_by_followers"
            : "get_top_users_by_project_views";

        let leaderboard = null;

        // Preferred path: database leaderboard RPC (accurate + fast).
        const { data: rpc, error: rpcErr } = await supabase.rpc(rpcName, { p_limit: 5 });
        if (!rpcErr && Array.isArray(rpc) && rpc.length) {
          leaderboard = rpc.map((r) => ({
            name: r.full_name || r.username || "Unknown",
            username: r.username,
            score: Number(r.score) || 0,
            open: r.username ? `/profile/${r.username}` : undefined,
          }));
        } else {
          // Fallback: client-side aggregation (works before the SQL migration
          // is applied; capped by PostgREST's row limit on large datasets).
          let ranked = [];
          if (metric === "badges") {
            const { data } = await supabase.from("user_achievements").select("user_id").limit(5000);
            ranked = topCounts(data, "user_id");
          } else if (metric === "followers") {
            const { data } = await supabase.from("follows").select("following_id").limit(5000);
            ranked = topCounts(data, "following_id");
          } else {
            const { data } = await supabase
              .from("projects")
              .select("owner_id, views")
              .eq("status", "published")
              .limit(5000);
            ranked = topSums(data, "owner_id", "views");
          }
          if (ranked.length) {
            const ids = ranked.map(([id]) => id);
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, username, full_name")
              .in("id", ids);
            const byId = new Map((profs || []).map((p) => [p.id, p]));
            leaderboard = ranked.map(([id, score]) => {
              const p = byId.get(id);
              return {
                name: p?.full_name || p?.username || "Unknown",
                username: p?.username,
                score,
                open: p?.username ? `/profile/${p.username}` : undefined,
              };
            });
          }
        }

        if (!leaderboard?.length) return { status: "no_data", message: "Not enough data to rank users yet." };
        if (open && leaderboard[0]?.open) go(leaderboard[0].open);
        return { status: "ok", metric, leaderboard, opened: open ? leaderboard[0]?.open : undefined };
      },
    },

    myStats: {
      description:
        "Report the signed-in user's own stats: total views and stars across their published projects, number of badges/achievements, and follower count.",
      handler: async () => {
        const uid = ctx.user?.id;
        if (!uid) return { status: "unauthenticated", message: "Sign in to see your stats." };
        const [proj, badges, followers] = await Promise.all([
          supabase.from("projects").select("views, likes_count").eq("owner_id", uid).eq("status", "published").limit(5000),
          supabase.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", uid),
          supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", uid),
        ]);
        const projects = proj.data || [];
        const totalViews = projects.reduce((n, p) => n + (Number(p.views) || 0), 0);
        const totalStars = projects.reduce((n, p) => n + (Number(p.likes_count) || 0), 0);
        return {
          status: "ok",
          projects: projects.length,
          totalViews,
          totalStars,
          badges: badges.count || 0,
          followers: followers.count || 0,
        };
      },
    },

    // === Notifications =====================================================
    checkNotifications: {
      description:
        "Report how many unread notifications the signed-in user has, with the most recent ones. Set open=true to also open the notifications inbox.",
      params: { open: { type: "boolean", description: "Also navigate to the inbox." } },
      handler: async ({ open = false }) => {
        const uid = ctx.user?.id;
        if (!uid) return { status: "unauthenticated", message: "Sign in to see notifications." };

        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", uid)
          .eq("is_read", false);

        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("receiver_id", uid)
          .order("created_at", { ascending: false })
          .limit(5);

        const recent = (data || []).map((n) => ({
          type: n.type ?? "notification",
          read: !!n.is_read,
          at: n.created_at,
        }));

        if (open) go("/profile?view=notifications");
        return {
          status: "ok",
          unread: count || 0,
          recent,
          opened: open ? "/profile?view=notifications" : undefined,
        };
      },
    },

    // === Explore filtering (page-scoped via bridge) ========================
    filterExplore: {
      description:
        "Filter or sort the Explore hub. category = code, design, or video. tech = a technology/tool (e.g. React, Figma, Blender). sort = latest, oldest, or popular (popular = most hyped/trending projects). view = grid or feed layout. mention = a spotlighted creator's @handle. clear = reset all filters. Navigates to Explore first if needed. NOTE: this filters by category/tech/popularity — to see one specific person's own projects use openProfile instead; filters live in grid view so applying one switches to grid.",
      params: {
        category: { type: "string", description: "Project category.", enum: ["code", "design", "video"] },
        tech: { type: "string", description: "Technology or tool to filter by, e.g. React or Figma." },
        sort: { type: "string", description: "Sort order (popular = most hyped).", enum: ["latest", "oldest", "popular"] },
        view: { type: "string", description: "Layout mode.", enum: ["grid", "feed"] },
        mention: { type: "string", description: "A spotlighted creator handle; empty string clears it." },
        clear: { type: "boolean", description: "Reset all Explore filters and sorting." },
      },
      handler: async ({ category, tech, sort, view, mention, clear }) => {
        const hasData = !!(category || tech || sort || clear);
        const already = ctx.pathname === "/explore";
        if (!already) go("/explore");

        // Page-owned state: layout view + spotlight mention. Data filters live
        // in grid view, so request a switch to grid whenever one is applied.
        const viewPayload = {};
        if (mention !== undefined) viewPayload.mention = mention;
        if (hasData) viewPayload.ensureGrid = true;
        else if (view) viewPayload.view = view;
        if (Object.keys(viewPayload).length) deliverVoiceCommand("explore.view", viewPayload);

        // GridContainer-owned state: category/tech/sort filters.
        if (hasData) deliverVoiceCommand("explore.data", { category, tech, sort, clear });

        return {
          status: "ok",
          navigated: !already,
          applied: { category, tech, sort, view, mention, clear },
        };
      },
    },

    filterTrending: {
      description:
        "Control the Trending page. view: 'projects' or 'creators' (yes, it CAN show trending creators). metric: how to rank — 'traffic' (views), 'stars' (likes), or 'hype' (weighted score). Navigates to Trending first if needed. Example: 'trending creators by traffic' → view=creators, metric=traffic.",
      params: {
        view: { type: "string", description: "Show trending projects or creators.", enum: ["projects", "creators"] },
        metric: { type: "string", description: "Ranking metric.", enum: ["traffic", "stars", "hype"] },
      },
      handler: async ({ view, metric }) => {
        const already = ctx.pathname === "/trending";
        if (!already) go("/trending");
        const payload = {};
        if (view) payload.view = view;
        if (metric) payload.metric = metric;
        deliverVoiceCommand("trending.control", payload);
        return { status: "ok", navigated: !already, applied: payload };
      },
    },

    // === Messaging (page-scoped via bridge) ================================
    openConversation: {
      description:
        "Open a direct-message conversation with a person by their name or username — this STARTS a new DM if you've never messaged them, so it works for anyone on Stark (also matches existing group/channel names). After it opens, use sendChatMessage to say something. If the person can't be found, it stays on the Messages page.",
      params: { name: { type: "string", required: true, description: "Person, group, or channel to open a chat with." } },
      handler: async ({ name }) => {
        if (ctx.pathname !== "/chat") go("/chat");
        deliverVoiceCommand("chat.open", { name });
        return { status: "ok", opening: name, note: "Opening the conversation; then call sendChatMessage." };
      },
    },

    sendChatMessage: {
      description:
        "Send a message in the conversation that's currently open on the Messages page. Open a conversation first with openConversation.",
      params: { text: { type: "string", required: true, description: "The message to send." } },
      handler: async ({ text }) => {
        if (ctx.pathname !== "/chat")
          return {
            status: "no_open_conversation",
            message: "Open a conversation first — say 'open my chat with <name>'.",
          };
        const sent = emitVoiceCommand("chat.send", { text });
        return sent
          ? { status: "ok", sent: text }
          : {
              status: "no_open_conversation",
              message: "No conversation is open. Say 'open chat with <name>' first.",
            };
      },
    },

    // === Create (page-scoped via bridge) ===================================
    startProject: {
      description:
        "Start creating a new project. Opens the Create flow and pre-fills the title and/or type (code, design, or video) when provided.",
      params: {
        title: { type: "string", description: "Working title for the project." },
        type: { type: "string", description: "Project category.", enum: ["code", "design", "video"] },
      },
      handler: async ({ title, type }) => {
        const payload = {};
        if (title) payload.title = title;
        if (type) payload.type = type;
        const already = ctx.pathname === "/create";
        if (!already) go("/create");
        deliverVoiceCommand("create.prefill", payload);
        return { status: "ok", navigated: !already, prefilled: payload };
      },
    },

    // === Preferences & session ============================================
    setTheme: {
      description: "Switch the interface theme.",
      params: {
        mode: { type: "string", required: true, description: "Theme to apply.", enum: ["light", "dark", "system"] },
      },
      handler: async ({ mode }) => {
        ctx.setTheme?.(mode);
        return { status: "ok", theme: mode };
      },
    },

    signOut: {
      description:
        "Sign the current user OUT of Stark and return to the login screen. This is for logging out, not logging in — if the user wants to log in, use the login action instead.",
      dangerous: true,
      requireConfirmation: true,
      handler: async () => {
        // Not signed in: nothing to sign out of — just take them to login.
        if (!ctx.user) return { status: "not_signed_in", opened: go("/login") };
        try {
          if (ctx.signOut) await ctx.signOut();
          else {
            await supabase.auth.signOut();
            go("/login");
          }
        } catch (err) {
          // AuthContext.signOut can throw on a stale session; force it and move on.
          await supabase.auth.signOut().catch(() => {});
          go("/login");
        }
        return { status: "ok" };
      },
    },
  });
}

// ---- singleton (browser only) ----------------------------------------------

let _client = null;
function getClient() {
  if (_client) return _client;
  _client = new VoxideClient({
    publicKey: PUBLIC_KEY,
    ui: {
      title: "Stark Assistant",
      subtitle: "Run Stark by voice",
      accentColor: "#FF0000", // Stark HYPER RED
      cornerRadius: "sharp", // matches Stark's 0px brutalist aesthetic
      skin: "glass",
      launcherIcon: "mic",
      greeting:
        "I'm your Stark co-pilot. Ask me to search, navigate, filter Explore, message someone, check notifications, or start a project.",
      placeholder: "Speak or type a command…",
      starters: [
        "Open my notifications",
        "Search for React projects",
        "Switch Explore to feed view",
        "Take me to trending",
      ],
      showModeToggle: true,
    },
  });
  registerCapabilities(_client);

  // Live UI state the agent can read every turn.
  _client.bindState(() => ({
    route: ctx.pathname,
    loggedIn: !!ctx.user,
    user: ctx.user ? { id: ctx.user.id, email: ctx.user.email } : null,
    onExplore: ctx.pathname === "/explore",
    onChat: ctx.pathname === "/chat",
    onCreate: ctx.pathname === "/create",
  }));

  return _client;
}

// ---- component --------------------------------------------------------------

export function Assistant() {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [ai, setAi] = useState(null);

  // Keep the module-scope handler context fresh (plain object writes — safe in
  // render, no React state involved).
  ctx.router = router;
  ctx.setTheme = setTheme;
  ctx.signOut = signOut;
  ctx.user = user || null;
  ctx.pathname = pathname || "/";

  // Build the client once, in the browser only.
  useEffect(() => {
    setAi(getClient());
  }, []);

  // Tell the agent which route it's on (drives route-scoped behavior).
  useEffect(() => {
    if (ai) ai.setActiveRoute(pathname || "/");
  }, [ai, pathname]);

  // Identify the user to the agent (and clear on sign-out).
  useEffect(() => {
    if (!ai) return;
    if (user) ai.setUser({ userId: user.id, email: user.email, name: user.user_metadata?.username });
    else ai.setUser(null);
  }, [ai, user]);

  if (!ai) return null;
  return (
    <VoxideWidget
      client={ai}
      accentColor="#FF0000"
      title="Stark Assistant"
      position="bottom-right"
      theme="auto"
    />
  );
}

export default Assistant;
