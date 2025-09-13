"use client";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);
  const [savedTheme, setSavedTheme] = useState("blue");

  useEffect(() => {
    setIsClient(true);
    const theme = localStorage.getItem("quickquiz-theme-color") || "blue";
    setSavedTheme(theme);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "quickquiz-theme-color") {
        setSavedTheme(e.newValue || "blue");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  console.error = () => {};
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <ColorSchemeScript />
        <title>QuickQuiz - Admin Panel</title>
        <meta
          name="description"
          content="AI-powered quiz creation and management platform"
        />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider
          defaultColorScheme="auto"
          theme={{
            primaryColor: isClient ? savedTheme : "blue",
            fontFamily: "var(--font-geist-sans), sans-serif",
          }}
        >
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
