import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAI - Smart Shop Assistant | Jodhpur Namkeen",
  description: "Voice-enabled ordering kiosk for Jodhpur Namkeen. Order samosas, kachoris, jalebis and more!",
  keywords: ["kiosk", "ordering", "voice", "AI", "Jodhpur Namkeen", "snacks"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
