import "./globals.css";
import { Suspense } from "react";
import ClientLayout from "@/components/clientlayout/clientlayout";

export const metadata = {
  title: "KianaStore Key",
  description: "For Those Who Come After",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#0E1116] text-white pt-16">
        <Suspense fallback={null}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}
