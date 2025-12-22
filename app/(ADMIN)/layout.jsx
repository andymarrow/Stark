import "../globals.css";
import { JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import AdminSidebar from "./admin/_components/AdminSidebar";
import AdminHeader from "./admin/_components/AdminHeader";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata = {
  title: "Stark // GOD MODE",
  description: "Administrative Control Panel",
  robots: "noindex, nofollow", // Crucial: Hide from Google
};

export default function AdminLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${mono.variable} font-sans bg-zinc-950 text-foreground antialiased selection:bg-red-500 selection:text-white`}>
        <div className="flex h-screen overflow-hidden">
            
            {/* 1. Fixed Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col bg-black">
                <AdminSidebar />
            </aside>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto p-6 bg-zinc-900/50">
                    {children}
                </main>
            </div>

        </div>
      </body>
    </html>
  );
}