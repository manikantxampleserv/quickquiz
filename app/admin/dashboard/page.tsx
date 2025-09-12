"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Badge,
  Stack,
  Grid,
  Group,
  Button,
} from "@mantine/core";
import {
  IconPlus,
  IconBrain,
  IconBulb,
} from "@tabler/icons-react";
import Link from "next/link";
import { DashboardSkeleton } from "../components/SkeletonLoaders";

interface Analytics {
  totalUsers: number;
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  recentActivity: any[];
  popularCategories: any[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/questions");
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/quizzes");
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAnalytics(),
        fetchQuestions(),
        fetchQuizzes()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <Container size="xl">
        <DashboardSkeleton />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Title order={2}>Dashboard Overview</Title>
        
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          <Card withBorder>
            <Text size="sm" c="dimmed">Total Quizzes</Text>
            <Text size="xl" fw={700}>{quizzes.length}</Text>
            <Text size="xs" c="dimmed">Active quizzes</Text>
          </Card>
          <Card withBorder>
            <Text size="sm" c="dimmed">Questions</Text>
            <Text size="xl" fw={700}>{questions.length}</Text>
            <Text size="xs" c="dimmed">In question bank</Text>
          </Card>
          <Card withBorder>
            <Text size="sm" c="dimmed">Total Users</Text>
            <Text size="xl" fw={700}>{analytics?.totalUsers || 0}</Text>
            <Text size="xs" c="dimmed">Registered users</Text>
          </Card>
          <Card withBorder>
            <Text size="sm" c="dimmed">AI Status</Text>
            <Badge color="green" variant="light">Active</Badge>
            <Text size="xs" c="dimmed">AI middleware running</Text>
          </Card>
        </SimpleGrid>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder>
              <Title order={4} mb="md">Recent Activity</Title>
              <Stack gap="xs">
                {analytics?.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                  <Group key={index} justify="space-between">
                    <Text size="sm">{activity.title || `Activity ${index + 1}`}</Text>
                    <Text size="xs" c="dimmed">{activity.time || 'Recently'}</Text>
                  </Group>
                )) || (
                  <Text size="sm" c="dimmed">No recent activity</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder>
              <Title order={4} mb="md">Quick Actions</Title>
              <Stack gap="xs">
                <Button
                  component={Link}
                  href="/admin/questions"
                  variant="light"
                  leftSection={<IconPlus size="1rem" />}
                  fullWidth
                >
                  Add Question
                </Button>
                <Button
                  component={Link}
                  href="/admin/quizzes"
                  variant="light"
                  leftSection={<IconBrain size="1rem" />}
                  fullWidth
                >
                  Create Quiz
                </Button>
                <Button
                  component={Link}
                  href="/admin/questions"
                  variant="light"
                  leftSection={<IconBulb size="1rem" />}
                  fullWidth
                >
                  Bulk Generate
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
