import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { LiveFormInspector } from "@/components/inspector/LiveFormInspector";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PulseStage • Post what your event needs, find the right people",
  description:
    "PulseStage is where event planners, performers, and crew find each other. Post what your event needs in about three minutes — no account required.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#F8F5EE] text-black min-h-screen flex flex-col selection:bg-[#FFDE59] selection:text-black`}
      >
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <LiveFormInspector />
          <CookieConsent />
          <Toaster position="top-right" richColors theme="light" />
        </SessionProvider>
      </body>
    </html>
  );
}
