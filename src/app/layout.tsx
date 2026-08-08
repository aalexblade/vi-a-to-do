import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/shared/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlanIt - To-Do & Calendar",
  description: "A comprehensive to-do and calendar application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-64 flex-1 p-8 bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}