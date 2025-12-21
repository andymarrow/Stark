import { GeistSans } from 'geist/font/sans';
import { JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
          {/* Navbars removed from here */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}