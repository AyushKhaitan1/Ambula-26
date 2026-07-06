import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Ambula Care - Smart Healthcare & Consultation Platform",
  description: "Search doctors, book instant appointments, and manage patient consultation records efficiently.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
