import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WagmiProvider } from "@/components/providers/WagmiProvider";
import { WalletModal } from "@/components/wallet/WalletModal";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans h-full`}
      >
        <WagmiProvider>
          <TooltipProvider>
            <main className="h-full">{children}</main>
            <WalletModal />
          </TooltipProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
