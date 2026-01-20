import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { TelegramProvider } from "@/contexts/TelegramContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEGO Marvel Battle",
  description: "Auto-battle game with Marvel LEGO characters",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Telegram WebApp Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
