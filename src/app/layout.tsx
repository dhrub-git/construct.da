import type { Metadata } from "next";
import { Geist_Mono, Lexend, Source_Sans_3 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import Providers from "@/redux/provider";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "construct.da",
  description:
    "Advisory pre-lodgement screening for residential approval preparation in NSW, Victoria, and Queensland.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${lexend.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
