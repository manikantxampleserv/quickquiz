"use client";

import {
  Container,
  Title,
  Card,
  Text,
  Stack,
  Group,
  Switch,
  Button,
  TextInput,
  Textarea,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export default function SettingsPage() {
  const settingsForm = useForm({
    initialValues: {
      siteName: "QuickQuiz",
      siteDescription: "AI-powered quiz platform",
      allowRegistration: true,
      requireEmailVerification: false,
      defaultQuizTimeLimit: 30,
      maxQuestionsPerQuiz: 50,
      aiProvider: "gemini",
    },
  });

  const handleSaveSettings = async (values: any) => {
    // Mock save - implement actual API call
    notifications.show({
      title: "Success",
      message: "Settings saved successfully!",
      color: "green",
    });
  };

  return (
    <Stack>
      <Stack gap="lg">
        <Title order={2}>Settings</Title>

        <form onSubmit={settingsForm.onSubmit(handleSaveSettings)}>
          <Stack gap="lg">
            <Card withBorder>
              <Title order={4} mb="md">
                General Settings
              </Title>
              <Stack gap="md">
                <TextInput label="Site Name" {...settingsForm.getInputProps("siteName")} />
                <Textarea
                  label="Site Description"
                  {...settingsForm.getInputProps("siteDescription")}
                />
              </Stack>
            </Card>

            <Card withBorder>
              <Title order={4} mb="md">
                User Settings
              </Title>
              <Stack gap="md">
                <Switch
                  label="Allow User Registration"
                  description="Allow new users to register"
                  {...settingsForm.getInputProps("allowRegistration", { type: "checkbox" })}
                />
                <Switch
                  label="Require Email Verification"
                  description="Users must verify their email before accessing the platform"
                  {...settingsForm.getInputProps("requireEmailVerification", { type: "checkbox" })}
                />
              </Stack>
            </Card>

            <Card withBorder>
              <Title order={4} mb="md">
                Quiz Settings
              </Title>
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="Default Quiz Time Limit (minutes)"
                    type="number"
                    {...settingsForm.getInputProps("defaultQuizTimeLimit")}
                  />
                  <TextInput
                    label="Max Questions Per Quiz"
                    type="number"
                    {...settingsForm.getInputProps("maxQuestionsPerQuiz")}
                  />
                </Group>
              </Stack>
            </Card>

            <Card withBorder>
              <Title order={4} mb="md">
                AI Settings
              </Title>
              <Stack gap="md">
                <Select
                  label="AI Provider"
                  description="Choose the AI provider for question generation"
                  data={[
                    { value: "gemini", label: "Google Gemini" },
                    { value: "openai", label: "OpenAI GPT" },
                    { value: "claude", label: "Anthropic Claude" },
                  ]}
                  {...settingsForm.getInputProps("aiProvider")}
                />
              </Stack>
            </Card>

            <Group justify="flex-end">
              <Button type="submit">Save Settings</Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
}
