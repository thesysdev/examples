"use client";

import dynamic from "next/dynamic";

// Dynamically import ThemeProvider to avoid SSR issues
const ThemeProvider = dynamic(
  () =>
    import("@thesysai/genui-sdk").then((mod) => ({
      default: mod.ThemeProvider,
    })),
  { ssr: false }
);

import React, { useEffect, useState } from "react";

export const ThemeProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? (
    <ThemeProvider mode="dark">{children}</ThemeProvider>
  ) : null;
};
