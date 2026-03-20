import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../providers/theme-provider";
import { ReactQueryProvider } from "../providers/react-query-provider";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MySocietyDetails SuperAdmin",
  description: "Management panel for MySocietyDetails app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${inter.className} font-sans min-h-screen bg-background antialiased`}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            {children}
            <Toaster />
            <SonnerToaster richColors position="top-right" />
          </ReactQueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
