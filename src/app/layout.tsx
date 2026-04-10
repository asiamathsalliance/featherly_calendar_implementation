import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Featherly — Support work calendar",
  description: "Calendar-based job matching for support workers",
  icons: {
    icon: [{ url: "/favicon-featherly.png", type: "image/png" }],
    shortcut: "/favicon-featherly.png",
    apple: "/favicon-featherly.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <Providers>
          <Nav />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
