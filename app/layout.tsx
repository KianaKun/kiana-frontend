import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kiana E-Commerce",
  description: "For Those Who Come After",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
