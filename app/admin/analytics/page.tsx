"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Stack,
  Group,
  Progress,
  Table,
  Skeleton,
} from "@mantine/core";
import { StatCardSkeleton, ActivityItemSkeleton } from "../components/SkeletonLoaders";

interface Analytics {
  totalUsers: number;
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  recentActivity: any[];
  popularCategories: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Title order={2}>Analytics Dashboard</Title>
        
        {loading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <Card withBorder>
              <Text size="sm" c="dimmed">Total Users</Text>
              <Text size="xl" fw={700}>{analytics?.totalUsers || 0}</Text>
              <Progress value={75} size="sm" mt="xs" />
            </Card>
            <Card withBorder>
              <Text size="sm" c="dimmed">Total Quizzes</Text>
              <Text size="xl" fw={700}>{analytics?.totalQuizzes || 0}</Text>
              <Progress value={60} size="sm" mt="xs" color="blue" />
            </Card>
            <Card withBorder>
              <Text size="sm" c="dimmed">Total Questions</Text>
              <Text size="xl" fw={700}>{analytics?.totalQuestions || 0}</Text>
              <Progress value={85} size="sm" mt="xs" color="green" />
            </Card>
            <Card withBorder>
              <Text size="sm" c="dimmed">Quiz Attempts</Text>
              <Text size="xl" fw={700}>{analytics?.totalAttempts || 0}</Text>
              <Progress value={45} size="sm" mt="xs" color="orange" />
            </Card>
          </SimpleGrid>
        )}

        <Group grow align="flex-start">
          <Card withBorder>
            <Title order={4} mb="md">Popular Categories</Title>
            {loading ? (
              <Stack gap="xs">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Group key={index} justify="space-between">
                    <Skeleton height={12} width="60%" />
                    <Skeleton height={12} width="30%" />
                  </Group>
                ))}
              </Stack>
            ) : (
              <Stack gap="xs">
                {analytics?.popularCategories?.map((category: any, index: number) => (
                  <Group key={index} justify="space-between">
                    <Text size="sm">{category.name}</Text>
                    <Text size="sm" c="dimmed">{category.questionCount} questions</Text>
                  </Group>
                )) || (
                  <Text size="sm" c="dimmed">No data available</Text>
                )}
              </Stack>
            )}
          </Card>

          <Card withBorder>
            <Title order={4} mb="md">Recent Activity</Title>
            {loading ? (
              <Stack gap="xs">
                {Array.from({ length: 5 }).map((_, index) => (
                  <ActivityItemSkeleton key={index} />
                ))}
              </Stack>
            ) : (
              <Stack gap="xs">
                {analytics?.recentActivity?.slice(0, 8).map((activity: any, index: number) => (
                  <Group key={index} justify="space-between">
                    <Text size="sm">{activity.title || `Activity ${index + 1}`}</Text>
                    <Text size="xs" c="dimmed">{activity.time || 'Recently'}</Text>
                  </Group>
                )) || (
                  <Text size="sm" c="dimmed">No recent activity</Text>
                )}
              </Stack>
            )}
          </Card>
        </Group>
      </Stack>
    </Container>
  );
}
