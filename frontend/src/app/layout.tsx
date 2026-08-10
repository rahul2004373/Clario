import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CSPostHogProvider } from "./providers/PostHogProvider";
import { PostHogPageView } from "./providers/PostHogPageView";
import { FeedbackWidget } from "@/components/ui/feedback-widget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clairo",
  description: "Multi-tenant AI chatbot platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CSPostHogProvider>
          <Suspense>
            <PostHogPageView />
          </Suspense>

          <TooltipProvider delay={300}>{children}</TooltipProvider>

          <div className="fixed bottom-6 right-6 z-50">
            <FeedbackWidget />
          </div>

          <Analytics />
        </CSPostHogProvider>
      </body>
    </html>
  );
}
