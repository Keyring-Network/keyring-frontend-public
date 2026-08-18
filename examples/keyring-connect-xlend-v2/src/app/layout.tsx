import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReownProvider from "@/components/providers/ReownProvider";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xLend Demo",
  description: "Demo application showing Keyring Connect integration",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');
  
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans h-full`}
      >
        <ReownProvider cookies={cookies}>
          <TooltipProvider>
            <main className="h-full">{children}</main>
            <Toaster theme="light" />
          </TooltipProvider>
        </ReownProvider>
      </body>
    </html>
  );
}
