import { 
  LayoutDashboard, Search, BarChart3, GitBranch, 
  Settings, Zap, Shield, MousePointer2, Globe 
} from "lucide-react";

export const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { 
    name: "SEO Optimization", 
    href: "/dashboard/seo", 
    icon: Search,
    children: [
      { name: "Audit Report", href: "/dashboard/seo" },
      { name: "Keyword Tracker", href: "/dashboard/seo" },
      { name: "Lighthouse Deep Dive", href: "/dashboard/seo" },
    ]
  },
  { 
    name: "Analytics SDK", 
    href: "/dashboard/analytics", 
    icon: BarChart3,
    children: [
      { name: "Traffic Overview", href: "/dashboard/analytics" },
      { name: "Heatmaps", href: "/dashboard/analytics" },
      { name: "User Journeys", href: "/dashboard/analytics" },
    ]
  },
  { 
    name: "Code Health", 
    href: "/dashboard/code", 
    icon: GitBranch,
    children: [
      { name: "Commit Log", href: "/dashboard/code" },
      { name: "Security Scan", href: "/dashboard/code" },
    ]
  },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const mockOverview = {
  healthScore: 88,
  metrics: [
    { title: "Total Visits", value: "24.5k", change: "+12%", trend: "up" },
    { title: "Avg. Session", value: "2m 14s", change: "+4%", trend: "up" },
    { title: "Bounce Rate", value: "42%", change: "-2%", trend: "down" }, // down is good for bounce
    { title: "Critical Issues", value: "3", change: "0", trend: "neutral" },
  ],
  recentCommits: [
    { id: "c1", message: "fix: hydration error on mobile", author: "Sami", time: "2h ago", status: "safe" },
    { id: "c2", message: "feat: add stripe checkout", author: "Sami", time: "5h ago", status: "warning" },
    { id: "c3", message: "chore: update dependencies", author: "Bot", time: "1d ago", status: "safe" },
  ]
};