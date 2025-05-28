import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GradPath - Course Prerequisite Visualization",
  description:
    "Plan your academic journey with our interactive course prerequisite visualization tool.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="w-full flex justify-center py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 mb-4">
            <a href="/" className="mx-2 font-semibold hover:underline">
              Home
            </a>
            <a
              href="/prereq-explorer"
              className="mx-2 font-semibold hover:underline"
            >
              Prereq Explorer
            </a>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
