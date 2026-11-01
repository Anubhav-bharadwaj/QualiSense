import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "QualiSense AI — Cosmetic Quality & Defect Prevention",
  description: "Predictive Quality Monitoring & Defect Prevention Platform for Cosmetics Manufacturing (L'Oréal Sustainability Challenge Option 02)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-100 text-slate-900 antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
