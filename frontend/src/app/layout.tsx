import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelloMamaBetter",
  description: "Your foster mother to walk you through life — trusted childcare in your community.",
  applicationName: "HelloMamaBetter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelloMamaBetter",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
