import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Gabelia Beauty Studio | CRM",
  description: "Sistema de gestão para clínicas de estética",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-surface">
        <Sidebar />
        <main className="flex-1 ml-72 min-h-screen">
          <div className="p-8 max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
