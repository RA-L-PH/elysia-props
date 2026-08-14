import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Italiana } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";
import Footer from "@/components/sections/Footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const italiana = Italiana({
  variable: "--font-italiana",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Elysia Properties Dubai | Ultra-Luxury Real Estate",
  description: "Experience beyond-horizon architecture, private Marina docks, and bespoke sky lounge penthouses with Elysia Properties Dubai. Dynamic tri-state luxury curation.",
  keywords: "Dubai Real Estate, Luxury Mansions, Palm Jumeirah, Sky Lounge Penthouse, Elysia Properties, Private Desk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${plusJakarta.variable} ${italiana.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas text-text-primary transition-colors duration-500 flex flex-col">
        <ThemeProvider>
          <CustomCursor />
          <Navbar />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
