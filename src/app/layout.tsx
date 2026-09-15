import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Trato — viaje con tarifa justa",
  description:
    "Rideshare con banda transparente y negociación corta. PWA móvil gratis sobre Supabase.",
  applicationName: "Trato",
  appleWebApp: {
    capable: true,
    title: "Trato",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1f6f66",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${figtree.variable} h-full`}>
      <body className="min-h-full bg-[oklch(0.96_0.01_170)] text-ink antialiased">
        <div className="trato-shell">{children}</div>
      </body>
    </html>
  );
}
