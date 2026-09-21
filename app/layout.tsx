import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";
import Navbar from "@/components/layout/Navbar";
import NextTopLoader from 'nextjs-toploader';
import { TooltipProvider } from "@/components/providers/TooltipProvider";
import { TooltipRenderer } from "@/components/ui/tooltip/TooltipRenderer";


const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const siteUrl = "https://www.gimiaw.web.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gilang Muhamad Widiagung | Full-stack Developer & Product Designer",
    template: "%s | Gilang Muhamad Widiagung",
  },
  description: "Official portfolio of Gilang Muhamad Widiagung (gimiaw | @gimigkk), a Full-stack Developer and Product Designer specializing in React, Next.js, TypeScript, and software engineering.",
  keywords: [
    "Gilang Muhamad Widiagung", "Gilang Widiagung", "Gilang Muhamad", "Gilang", "Gimiaw", "gimigkk",
    "Full-stack Developer", "Product Designer", "Software Engineer", "Indonesia Developer",
    "React", "Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind", "Rust", "Docker", "Godot"
  ],
  authors: [{ name: "Gilang Muhamad Widiagung", url: siteUrl }],
  creator: "Gilang Muhamad Widiagung",
  publisher: "Gilang Muhamad Widiagung",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gilang Muhamad Widiagung | Full-stack Developer & Product Designer",
    description: "Portfolio of Gilang Muhamad Widiagung (Gimiaw), Full-stack Developer and Product Designer.",
    url: siteUrl,
    siteName: "Gilang Muhamad Widiagung Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gilang Muhamad Widiagung | Full-stack Developer & Product Designer",
    description: "Portfolio of Gilang Muhamad Widiagung (Gimiaw), Full-stack Developer and Product Designer.",
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
  appleWebApp: {
    title: "Gilang Muhamad Widiagung Portfolio",
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
      className={`${plusJakartaSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {/* Clear stale #project= hash BEFORE React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=location.hash;if(h&&h.indexOf("#project=")===0){history.replaceState(null,"",location.pathname+location.search)}})`
          }}
        />
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
        <TooltipProvider>
          <TooltipRenderer />
          <Navbar />
          <LenisProvider>{children}</LenisProvider>
        </TooltipProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "@id": "https://www.gimiaw.web.id/#person",
              name: "Gilang Muhamad Widiagung",
              givenName: "Gilang",
              additionalName: "Muhamad",
              familyName: "Widiagung",
              alternateName: ["Gilang Widiagung", "Gilang", "Gimiaw", "gimigkk"],
              url: "https://www.gimiaw.web.id",
              image: "https://www.gimiaw.web.id/mukagw.JPG",
              jobTitle: "Full-stack Developer & Product Designer",
              worksFor: {
                "@type": "Organization",
                name: "Freelance",
              },
              sameAs: [
                "https://github.com/gimigkk",
                "https://instagram.com/gimigkk",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://www.gimiaw.web.id/#website",
              name: "Gilang Muhamad Widiagung Portfolio",
              url: "https://www.gimiaw.web.id",
              description: "Official portfolio of Gilang Muhamad Widiagung (gimiaw | @gimigkk), a Full-stack Developer and Product Designer.",
              inLanguage: "en-US",
              publisher: {
                "@id": "https://www.gimiaw.web.id/#person",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
