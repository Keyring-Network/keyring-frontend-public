import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keyring Data Sharing Example",
  description: "A partner integration showing how verified data reaches your backend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
