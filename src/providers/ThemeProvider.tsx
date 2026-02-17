"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  return {
    theme: (resolvedTheme || theme || "dark") as "light" | "dark",
    setTheme,
    toggleTheme,
  };
}
