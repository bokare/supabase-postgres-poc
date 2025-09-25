import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow - Professional Todo Manager",
  description:
    "A modern, professional task management application built with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <ToastProvider>
          <div className="min-h-svh bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <NavBar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
