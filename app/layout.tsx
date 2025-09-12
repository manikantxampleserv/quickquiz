"use client";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <title>QuickQuiz - Admin Panel</title>
        <meta
          name="description"
          content="AI-powered quiz creation and management platform"
        />
      </head>
      <body className={`antialiased`}>
        <MantineProvider
          defaultColorScheme="auto"
          theme={{
            primaryColor: "blue",
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
