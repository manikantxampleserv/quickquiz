"use client";

import {
  Button,
  ColorSwatch,
  Divider,
  Drawer,
  Group,
  Stack,
  Switch,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface ThemeSidebarProps {
  opened: boolean;
  onClose: () => void;
}

const themeColors = [
  { name: "Blue", value: "blue", color: "#228be6" },
  { name: "Green", value: "green", color: "#40c057" },
  { name: "Red", value: "red", color: "#fa5252" },
  { name: "Purple", value: "violet", color: "#7c3aed" },
  { name: "Orange", value: "orange", color: "#fd7e14" },
  { name: "Pink", value: "pink", color: "#e64980" },
  { name: "Teal", value: "teal", color: "#12b886" },
  { name: "Indigo", value: "indigo", color: "#4c6ef5" },
];

export default function ThemeSidebar({ opened, onClose }: ThemeSidebarProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [selectedColor, setSelectedColor] = useState("blue");

  // Load saved theme color on component mount
  useEffect(() => {
    const savedColor = localStorage.getItem("quickquiz-theme-color");
    if (savedColor) {
      setSelectedColor(savedColor);
      applyThemeColor(savedColor);
    }
  }, []);

  const applyThemeColor = (colorValue: string) => {
    // Save to localStorage for persistence
    localStorage.setItem("quickquiz-theme-color", colorValue);

    // Update CSS custom properties for comprehensive theme color changes
    document.documentElement.style.setProperty(
      "--mantine-primary-color-filled",
      `var(--mantine-color-${colorValue}-6)`
    );
    document.documentElement.style.setProperty(
      "--mantine-primary-color-light",
      `var(--mantine-color-${colorValue}-1)`
    );
    document.documentElement.style.setProperty(
      "--mantine-primary-color-outline",
      `var(--mantine-color-${colorValue}-6)`
    );

    // Comprehensive UI color updates with stronger specificity
    const style = document.createElement("style");
    style.textContent = `
      /* Buttons - Comprehensive coverage */
      .mantine-Button-root[data-variant="filled"]:not([data-color]),
      .mantine-Button-root[data-variant="filled"]:not([data-color]):not(:disabled),
      .mantine-Button-root:not([data-color]):not([data-variant]),
      button[class*="mantine-Button-root"]:not([data-color]):not([class*="variant"]) {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        border-color: var(--mantine-color-${colorValue}-6) !important;
        color: white !important;
      }
      .mantine-Button-root[data-variant="filled"]:not([data-color]):hover:not(:disabled),
      .mantine-Button-root[data-variant="filled"]:not([data-color]):focus:not(:disabled),
      .mantine-Button-root:not([data-color]):not([data-variant]):hover:not(:disabled),
      .mantine-Button-root:not([data-color]):not([data-variant]):focus:not(:disabled),
      button[class*="mantine-Button-root"]:not([data-color]):not([class*="variant"]):hover:not(:disabled) {
        background-color: var(--mantine-color-${colorValue}-7) !important;
        border-color: var(--mantine-color-${colorValue}-7) !important;
        color: white !important;
      }
      
      /* Ensure button text visibility */
      .mantine-Button-root[data-variant="filled"]:not([data-color]) .mantine-Button-label,
      .mantine-Button-root[data-variant="filled"]:not([data-color]) *,
      .mantine-Button-root:not([data-color]):not([data-variant]) .mantine-Button-label,
      .mantine-Button-root:not([data-color]):not([data-variant]) *,
      button[class*="mantine-Button-root"]:not([data-color]) .mantine-Button-label,
      button[class*="mantine-Button-root"]:not([data-color]) * {
        color: white !important;
      }
      .mantine-Button-root[data-variant="light"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-1) !important;
        color: var(--mantine-color-${colorValue}-7) !important;
      }
      .mantine-Button-root[data-variant="light"]:not([data-color]):hover:not(:disabled) {
        background-color: var(--mantine-color-${colorValue}-2) !important;
      }
      .mantine-Button-root[data-variant="outline"]:not([data-color]) {
        border-color: var(--mantine-color-${colorValue}-6) !important;
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-Button-root[data-variant="outline"]:not([data-color]):hover:not(:disabled) {
        background-color: var(--mantine-color-${colorValue}-1) !important;
      }
      
      /* Badges */
      .mantine-Badge-root[data-variant="filled"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-Badge-root[data-variant="light"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-1) !important;
        color: var(--mantine-color-${colorValue}-7) !important;
      }
      .mantine-Badge-root[data-variant="outline"]:not([data-color]) {
        border-color: var(--mantine-color-${colorValue}-6) !important;
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Action Icons */
      .mantine-ActionIcon-root[data-variant="filled"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-ActionIcon-root[data-variant="filled"]:not([data-color]):hover:not(:disabled) {
        background-color: var(--mantine-color-${colorValue}-7) !important;
      }
      .mantine-ActionIcon-root[data-variant="light"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-1) !important;
        color: var(--mantine-color-${colorValue}-7) !important;
      }
      .mantine-ActionIcon-root[data-variant="outline"]:not([data-color]) {
        border-color: var(--mantine-color-${colorValue}-6) !important;
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Navigation - Enhanced specificity */
      .mantine-AppShell-navbar .mantine-Button-root[data-variant="filled"],
      .mantine-AppShell-navbar .mantine-Button-root[data-variant="filled"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-AppShell-navbar .mantine-Button-root[data-variant="filled"]:hover,
      .mantine-AppShell-navbar .mantine-Button-root[data-variant="filled"]:not([data-color]):hover {
        background-color: var(--mantine-color-${colorValue}-7) !important;
        border-color: var(--mantine-color-${colorValue}-7) !important;
      }
      .mantine-AppShell-navbar .mantine-Button-root[data-variant="subtle"]:not([data-color]) {
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-AppShell-navbar .mantine-Button-root[data-variant="subtle"]:not([data-color]):hover {
        background-color: var(--mantine-color-${colorValue}-1) !important;
        color: var(--mantine-color-${colorValue}-7) !important;
      }
      
      /* Tabs */
      .mantine-Tabs-tab[data-active] {
        border-color: var(--mantine-color-${colorValue}-6) !important;
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Links and Text Colors */
      .mantine-Anchor-root:not([data-color]) {
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-Anchor-root:not([data-color]):hover {
        color: var(--mantine-color-${colorValue}-7) !important;
      }
      
      /* Form Controls */
      .mantine-TextInput-input:focus,
      .mantine-Textarea-input:focus,
      .mantine-Select-input:focus,
      .mantine-NumberInput-input:focus {
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Checkbox and Radio */
      .mantine-Checkbox-input:checked {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-Radio-radio:checked {
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-Radio-radio:checked::before {
        background-color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Switch */
      .mantine-Switch-track[data-checked] {
        background-color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Progress and Loader */
      .mantine-Progress-bar {
        background-color: var(--mantine-color-${colorValue}-6) !important;
      }
      .mantine-Loader-root,
      .mantine-Loader-root svg,
      .mantine-Loader-root circle {
        color: var(--mantine-color-${colorValue}-6) !important;
        stroke: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Button loaders - specifically target loading state */
      .mantine-Button-root[data-loading="true"] .mantine-Loader-root,
      .mantine-Button-root[data-loading="true"] .mantine-Loader-root svg,
      .mantine-Button-root[data-loading="true"] .mantine-Loader-root circle {
        color: var(--mantine-color-${colorValue}-6) !important;
        stroke: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Modal button loaders */
      .mantine-Modal-root .mantine-Button-root[data-loading="true"] .mantine-Loader-root,
      .mantine-Modal-root .mantine-Button-root[data-loading="true"] .mantine-Loader-root svg,
      .mantine-Modal-root .mantine-Button-root[data-loading="true"] .mantine-Loader-root circle {
        color: white !important;
        stroke: white !important;
      }
      
      /* Skeleton loaders */
      .mantine-Skeleton-root {
        background: linear-gradient(90deg, 
          var(--mantine-color-${colorValue}-1) 25%, 
          var(--mantine-color-${colorValue}-2) 50%, 
          var(--mantine-color-${colorValue}-1) 75%) !important;
      }
      
      /* Notifications */
      .mantine-Notification-root[data-color="${colorValue}"] {
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Modal and Drawer */
      .mantine-Modal-header,
      .mantine-Drawer-header {
        border-bottom-color: var(--mantine-color-${colorValue}-2) !important;
      }
      
      /* Modal buttons - specific targeting */
      .mantine-Modal-root .mantine-Button-root:not([data-color]):not([data-variant]),
      .mantine-Modal-root .mantine-Button-root[data-variant="filled"]:not([data-color]) {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        border-color: var(--mantine-color-${colorValue}-6) !important;
        color: white !important;
      }
      .mantine-Modal-root .mantine-Button-root:not([data-color]):not([data-variant]):hover,
      .mantine-Modal-root .mantine-Button-root[data-variant="filled"]:not([data-color]):hover {
        background-color: var(--mantine-color-${colorValue}-7) !important;
        border-color: var(--mantine-color-${colorValue}-7) !important;
        color: white !important;
      }
      
      /* Cards with accent */
      .mantine-Card-root[data-accent] {
        border-left: 4px solid var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Custom accent colors for specific elements */
      [data-theme-accent] {
        color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Badge elements with theme accent get background color */
      .mantine-Badge-root[data-theme-accent] {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        color: white !important;
      }
      [data-theme-bg] {
        background-color: var(--mantine-color-${colorValue}-1) !important;
      }
      [data-theme-border] {
        border-color: var(--mantine-color-${colorValue}-6) !important;
      }
      
      /* Fix text visibility in badges with theme accent */
      .mantine-Badge-root[data-theme-accent] {
        background-color: var(--mantine-color-${colorValue}-6) !important;
        color: white !important;
      }
      
      /* Ensure text is visible in all theme elements */
      .mantine-Badge-root[data-theme-accent] .mantine-Badge-label,
      .mantine-Badge-root[data-theme-accent] * {
        color: white !important;
      }
    `;

    // Remove existing theme style if any
    const existingStyle = document.getElementById("theme-color-override");
    if (existingStyle) {
      existingStyle.remove();
    }

    style.id = "theme-color-override";
    document.head.appendChild(style);
  };

  const handleColorChange = (colorValue: string) => {
    setSelectedColor(colorValue);
    applyThemeColor(colorValue);
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconPalette size="1.2rem" />
          <Title order={4}>Theme Customization</Title>
        </Group>
      }
      position="right"
      size="md"
      padding="md"
    >
      <Stack gap="lg">
        {/* Dark/Light Mode Toggle */}
        <div>
          <Text fw={500} mb="sm">
            Appearance
          </Text>
          <Group justify="space-between">
            <Text size="sm">Dark Mode</Text>
            <Switch
              checked={colorScheme === "dark"}
              onChange={toggleColorScheme}
              size="md"
            />
          </Group>
        </div>

        <Divider />

        {/* Color Theme Selection */}
        <div>
          <Text fw={500} mb="sm">
            Primary Color
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            Choose your preferred theme color
          </Text>

          <Stack gap="xs">
            {themeColors.map((color) => (
              <Group
                key={color.value}
                justify="space-between"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border:
                    selectedColor === color.value
                      ? `2px solid ${color.color}`
                      : "2px solid transparent",
                  backgroundColor:
                    selectedColor === color.value
                      ? `${color.color}10`
                      : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => handleColorChange(color.value)}
              >
                <Group gap="sm">
                  <ColorSwatch color={color.color} size={20} />
                  <Text size="sm">{color.name}</Text>
                </Group>
                {selectedColor === color.value && (
                  <Text size="xs" c={color.value}>
                    ✓ Active
                  </Text>
                )}
              </Group>
            ))}
          </Stack>
        </div>

        <Divider />

        {/* Font Information */}
        <div>
          <Text fw={500} mb="sm">
            Typography
          </Text>
          <Group justify="space-between">
            <Text size="sm">Font Family</Text>
            <Text size="sm" c="dimmed" style={{ fontFamily: "Poppins" }}>
              Poppins
            </Text>
          </Group>
        </div>

        <Divider />

        {/* Reset Button */}
        <Button
          variant="light"
          color="gray"
          onClick={() => {
            setSelectedColor("blue");
            localStorage.removeItem("quickquiz-theme-color");
            const existingStyle = document.getElementById(
              "theme-color-override"
            );
            if (existingStyle) {
              existingStyle.remove();
            }
            // Reset CSS custom properties to default
            document.documentElement.style.removeProperty(
              "--mantine-primary-color-filled"
            );
            document.documentElement.style.removeProperty(
              "--mantine-primary-color-light"
            );
            document.documentElement.style.removeProperty(
              "--mantine-primary-color-outline"
            );
          }}
        >
          Reset to Default
        </Button>
      </Stack>
    </Drawer>
  );
}
