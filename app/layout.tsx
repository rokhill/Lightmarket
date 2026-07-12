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
  title: "LightMarket - AI-Native Prediction Markets on LCAI",
  description: "The First AI-native prediction market on LightchainAI. Every outcome resolved by verifiable inference.",
icons: {
  icon: [{ url: "/favicon.ico?v=2", sizes: "32x32" }, { url: "/favicon.png?v=2", sizes: "192x192" }],
  shortcut: "/favicon.png",
  apple: "/icon.png"
},
  manifest: "/manifest.json"
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
