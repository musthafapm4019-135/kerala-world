import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kerala World — The road is yours",
  description: "Explore a living Kerala-inspired 3D world. Drive the coast, discover the backwaters, and travel together.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

