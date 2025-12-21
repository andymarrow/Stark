import "../globals.css";
import { JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata = {
  title: "Access Control | Stark",
  description: "Authenticate to enter the network.",
};

export default function AuthLayout({ children }) {
  return (
    <div className={`${GeistSans.variable} ${mono.variable} font-sans bg-background text-foreground min-h-screen`}>
        {children}
    </div>
  );
}