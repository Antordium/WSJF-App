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
  title: "WSJF Prioritization Calculator",
  description: "Prioritize software initiatives using Weighted Shortest Job First methodology. Calculate Cost of Delay and Job Size to make data-driven prioritization decisions.",
  keywords: ["WSJF", "prioritization", "agile", "software development", "cost of delay", "job size"],
  authors: [{ name: "WSJF Calculator Team" }],
  creator: "WSJF Calculator",
  publisher: "WSJF Calculator",
  openGraph: {
    title: "WSJF Prioritization Calculator",
    description: "Prioritize software initiatives using Weighted Shortest Job First methodology",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "WSJF Prioritization Calculator",
    description: "Prioritize software initiatives using Weighted Shortest Job First methodology",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://wsjf-prioritization-calculator.vercel.app'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
