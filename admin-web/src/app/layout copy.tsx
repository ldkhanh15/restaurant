import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/shared/AuthGate";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "My Restaurant Dashboard",
  description: "PBL6",
  generator: "pbl6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} h-full`}
      >
        <AuthGate>
          <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </AuthGate>
        <Analytics />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
