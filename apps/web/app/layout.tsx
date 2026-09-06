import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PhoneStage } from "@/components/PhoneStage";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "TipTop",
  description: "Sors. Rencontre. Vis.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TipTop", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <PhoneStage>{children}</PhoneStage>
        </Providers>
      </body>
    </html>
  );
}
