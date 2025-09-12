"use client";

import { useState } from "react";
import {
  AppShell,
  Button,
  Group,
  Stack,
  Title,
  ActionIcon,
  Burger,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconUsers,
  IconChartBar,
  IconBrain,
  IconQuestionMark,
  IconSun,
  IconMoon,
  IconSettings,
  IconPalette,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSidebar from "./components/ThemeSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const [themeOpened, { open: openTheme, close: closeTheme }] =
    useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();

  const navigation = [
    { href: "/admin/dashboard", label: "Dashboard", icon: IconDashboard },
    {
      href: "/admin/questions",
      label: "Question Bank",
      icon: IconQuestionMark,
    },
    { href: "/admin/quizzes", label: "Quiz Management", icon: IconBrain },
    { href: "/admin/analytics", label: "Analytics", icon: IconChartBar },
    // { href: "/admin/users", label: "User Management", icon: IconUsers },
    { href: "/admin/settings", label: "Settings", icon: IconSettings },
  ];

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3}>
              <Text
                span
                inherit
                className="!text-3xl font-bold"
                data-theme-accent
              >
                Q
              </Text>
              uick
              <Text
                span
                inherit
                className="!text-3xl font-bold"
                data-theme-accent
              >
                Q
              </Text>
              uiz
            </Title>
          </Group>
          <Group gap="sm">
            <ActionIcon
              onClick={openTheme}
              variant="default"
              size="xl"
              title="Theme Settings"
            >
              <IconPalette size="1.1rem" />
            </ActionIcon>
            <ActionIcon
              onClick={() => toggleColorScheme()}
              variant="default"
              size="xl"
              title="Toggle Dark Mode"
            >
              {colorScheme === "dark" ? (
                <IconSun size="1.1rem" />
              ) : (
                <IconMoon size="1.1rem" />
              )}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={isActive ? "filled" : "subtle"}
                leftSection={<Icon size="1rem" />}
                justify="flex-start"
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <ThemeSidebar opened={themeOpened} onClose={closeTheme} />
    </AppShell>
  );
}
