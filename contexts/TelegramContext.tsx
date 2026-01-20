"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  TelegramUser,
  TelegramWebApp,
  getTelegramWebApp,
  getTelegramUser,
  isTelegramWebApp,
  getMockUser,
} from "@/lib/telegram";

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  isTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  user: null,
  isReady: false,
  isTelegram: false,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for Telegram WebApp to be available
    const initTelegram = () => {
      const tgWebApp = getTelegramWebApp();

      if (tgWebApp) {
        // Initialize Telegram WebApp
        tgWebApp.ready();
        tgWebApp.expand();

        // Set dark theme
        tgWebApp.setHeaderColor("#0a0a0f");
        tgWebApp.setBackgroundColor("#0a0a0f");

        setWebApp(tgWebApp);
        setUser(getTelegramUser());
      } else {
        // Development mode - use mock user
        console.log("Running outside Telegram, using mock user");
        setUser(getMockUser());
      }

      setIsReady(true);
    };

    // Small delay to ensure script is loaded
    const timer = setTimeout(initTelegram, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        isReady,
        isTelegram: isTelegramWebApp(),
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
