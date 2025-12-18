import { GeistSans } from 'geist/font/sans';
import { JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // You'll create this or I'll provide it
import DesktopNavbar from './(HOME)/_components/DesktopNavbar';
import MobileTabBar from './(HOME)/_components/MobileTabBar';

const mono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-jetbrains-mono" 
});

export const metadata = {
  title: "Stark | The Creator Hub",
  description: "A developer portfolio network for creators who ship.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${mono.variable} font-sans bg-background text-foreground selection:bg-accent selection:text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* DESKTOP NAV - Hidden on Mobile */}
          <div className="hidden md:block sticky top-0 z-50">
             <DesktopNavbar />
          </div>

          <main className="min-h-screen pb-20 md:pb-0">
            {children}
          </main>

          {/* MOBILE NAV - Hidden on Desktop */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <MobileTabBar />
          </div>
          
        </ThemeProvider>
      </body>
    </html>
  );
}