"use client";
import { SessionProvider } from "next-auth/react";

/** next-auth/react's useSession throws unless it sits under a SessionProvider. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
