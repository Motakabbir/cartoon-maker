import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AI Cartoon Generator",
  description: "Create stunning animated cartoons with AI-powered character generation, scene composition, and voice synthesis",
  applicationName: "AI Cartoon Generator",
  authors: [{ name: "AI Cartoon Generator Team" }],
  keywords: ["AI", "cartoon", "animation", "video", "generator", "characters", "voice synthesis"],
  creator: "AI Cartoon Generator Team",
  metadataBase: new URL('https://cartoon-generator.example.com'),
  openGraph: {
    type: "website",
    title: "AI Cartoon Generator",
    description: "Create stunning animated cartoons with AI-powered character generation, scene composition, and voice synthesis",
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AI Cartoon Generator",
    description: "Create stunning animated cartoons with AI-powered character generation, scene composition, and voice synthesis",
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#7e22ce', // Purple 700
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans selection:bg-purple-200 selection:text-purple-900 bg-gradient-to-b from-purple-50/50 to-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
