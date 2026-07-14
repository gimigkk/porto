import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";
import Navbar from "@/components/layout/Navbar";
import NextTopLoader from 'nextjs-toploader';
import { TooltipProvider } from "@/components/providers/TooltipProvider";
import { TooltipRenderer } from "@/components/ui/tooltip/TooltipRenderer";
import JumpingDots from "@/components/shared/JumpingDots";

import { WdyrProvider } from "@/components/providers/WdyrProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const siteUrl = "https://www.gimiaw.web.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gilang | Full-stack Developer & Product Designer",
    template: "%s | Gilang's Portfolio",
  },
  description: "Portfolio of Gilang (gimiaw|@gimigkk), a Full-stack Developer and Product Designer specializing in React, Next.js, TypeScript, and creative technical solutions.",
  keywords: [
    "Full-stack Developer", "Product Designer", "React", "Next.js", "TypeScript",
    "Prisma", "PostgreSQL", "Astro", "Tailwind", "Rust", "Docker", "Supabase",
    "Unity", "C#", "Flutter", "Godot", "Web Development", "Software Engineer",
    "Gilang", "Gimiaw", "Indonesia"
  ],
  authors: [{ name: "Gilang", url: siteUrl }],
  creator: "Gilang",
  publisher: "Gilang",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gilang | Full-stack Developer & Product Designer",
    description: "Portfolio of Gilang (Gimiaw), a Full-stack Developer and Product Designer.",
    url: siteUrl,
    siteName: "Gilang's Portfolio",
    images: [
      {
        url: "/mukagw.JPG",
        width: 800,
        height: 600,
        alt: "Gilang Profile Picture",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gilang | Full-stack Developer & Product Designer",
    description: "Portfolio of Gilang (Gimiaw), a Full-stack Developer and Product Designer.",
    images: ["/mukagw.JPG"],
    creator: "@gimiaw",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/munching-cat.gif",
    apple: "/munching-cat.gif",
  },
  appleWebApp: {
    title: "Gilang's Portfolio",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* SSR loading screen — renders in initial HTML before any JS executes */}
        <div
          id="ssr-loading-screen"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom, #0c3888, #50aaff)',
            transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          aria-hidden="true"
        >
          <JumpingDots />
        </div>
        <NextTopLoader
          color="var(--top-loader-color, #000000)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="none"
          zIndex={2147483647}
        />
        <WdyrProvider>
          <TooltipProvider>
            <TooltipRenderer />
            <Navbar />
            <LenisProvider>{children}</LenisProvider>
          </TooltipProvider>
        </WdyrProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Gilang",
              url: "https://www.gimiaw.web.id",
              image: "https://www.gimiaw.web.id/mukagw.JPG",
              jobTitle: "Full-stack Developer & Product Designer",
              worksFor: {
                "@type": "Organization",
                name: "Freelance"
              },
              sameAs: [
                "https://github.com/gimigkk"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Gilang's Portfolio",
              url: "https://www.gimiaw.web.id",
            })
          }}
        />
      </body>
    </html>
  );
}
