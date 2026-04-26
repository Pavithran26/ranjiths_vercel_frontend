import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import "./globals.css";

const uiFont = Manrope({
  subsets: ["latin"],
  variable: "--font-ui"
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

export const metadata = {
  title: "SRK Coconut ERP",
  description: "Operations dashboard for coconut harvesting and trading"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
