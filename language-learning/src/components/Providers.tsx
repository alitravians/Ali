"use client";

import { SessionProvider } from "next-auth/react";
import LoadingScreen from "./LoadingScreen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoadingScreen>{children}</LoadingScreen>
    </SessionProvider>
  );
}
