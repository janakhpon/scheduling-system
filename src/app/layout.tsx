import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Scheduling System",
  description: "A simple POC scheduling system",
  keywords: ["scheduling", "appointments", "booking", "POC", "demo"],
  authors: [{ name: "Scheduling System" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Scheduling System",
    description: "A simple POC scheduling system",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Scheduling System",
    description: "A simple POC scheduling system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
