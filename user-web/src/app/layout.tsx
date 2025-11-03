import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth";
import { RouterProvider } from "@/lib/router";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { Suspense } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import GlobalChatWidget from "@/components/global-chat-widget";
import SocketListeners from "@/components/socket/SocketListeners";

export const metadata: Metadata = {
  title: "HIWELL - Fine Dining Experience",
  description:
    "Nhà hàng cao cấp mang đến trải nghiệm ẩm thực đẳng cấp thế giới",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="antialiased font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-background text-foreground">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          }
        >
          <AuthProvider>
            <WebSocketProvider>
              <RouterProvider>
                <SocketListeners />
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <GlobalChatWidget />
                </div>
              </RouterProvider>
            </WebSocketProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
