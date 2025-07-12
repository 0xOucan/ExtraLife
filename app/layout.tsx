import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { initializeDatabase } from '@/lib/database/connection';
import { policyActivator } from "@/lib/services/policy-activator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Extra Life - Seguro de Vida",
  description: "Seguro de vida inteligente para México",
};

// Initialize database and start services on app startup
if (typeof window === "undefined") {
  // Only run on server side
  initializeDatabase().catch(console.error);
  policyActivator.start();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
