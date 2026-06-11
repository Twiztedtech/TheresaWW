import type { Metadata } from "next";
import { Inter, Playfair_Display, Great_Vibes } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cursive",
});

export const metadata: Metadata = {
  title: "Theresa's Celebration Portal",
  description: "A magnificent digital celebration box for Theresa. Features a virtual opening envelope with an interactive notebook, beautiful ambient synthesizer soundtrack, customized AI poetry engine, cherished memories gallery, and a real-time wishes guestbook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${greatVibes.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
