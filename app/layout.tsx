// app/layout.tsx
import "./globals.css";
import { Suspense } from "react";

export const metadata = {
  title: "KianaStore Key",
  description: "For Those Who Come After",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Suspense fallback={null}>
        {children}
        </Suspense>
      </body>
    </html>
  );
}
