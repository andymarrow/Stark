import { GeistSans } from 'geist/font/sans';
import { JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics } from '@next/third-parties/google'; 
import OfflineStatus from "@/components/OfflineStatus"; 
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from './_context/AuthContext';
import BadgeListener from "@/components/BadgeListener";
import KonamiListener from "@/components/KonamiListener";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stark | The Creator Hub",
    template: "%s | Stark" 
  },
  description: "The definitive portfolio network for creators who ship. Stop searching for inspiration in static screenshots—see the source code, live demos, and architecture.",
  keywords: [
    "developer portfolio",
    "open source",
    "ui inspiration",
    "react templates",
    "nextjs showcase",
    "design engineers",
    "frontend community"
  ],
  authors: [{ name: "Your Name", url: "https://twitter.com/yourhandle" }],
  creator: "Stark Network",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Stark | Build. Share. Inspire.",
    description: "The open-source portfolio network for Developers, Designers, and Motion Creators.",
    siteName: "Stark",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Stark Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stark | The Creator Hub",
    description: "Don't just look at pixels. Inspect the code.",
    images: ["/og-image.png"], 
    creator: "@yourhandle",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/site.webmanifest',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${mono.variable} font-sans bg-background text-foreground selection:bg-accent selection:text-white`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <BadgeListener />
            <KonamiListener />
            {children}
            <OfflineStatus />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
        <GoogleAnalytics gaId="G-VZC34CDBG8" />
      </body>
    </html>
  );
}