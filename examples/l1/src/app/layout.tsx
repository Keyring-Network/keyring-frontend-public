import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keyring Network SDK Test App",
  description: "Keyring Network SDK Test App",
};

import ClientRootLayout from "./client-layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientRootLayout>{children}</ClientRootLayout>;
}
