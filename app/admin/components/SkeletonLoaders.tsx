"use client";

import { Card, Skeleton, Stack, Group, SimpleGrid } from "@mantine/core";

export function StatCardSkeleton() {
  return (
    <Card withBorder>
      <Stack gap="xs">
        <Skeleton height={12} width="60%" />
        <Skeleton height={24} width="40%" />
        <Skeleton height={8} width="80%" />
      </Stack>
    </Card>
  );
}

export function QuestionCardSkeleton() {
  return (
    <Card withBorder>
      <Stack gap="xs">
        <Skeleton height={16} width="90%" />
        <Skeleton height={12} width="70%" />
        <Group justify="space-between">
          <Skeleton height={20} width={80} radius="xl" />
          <Skeleton height={20} width={60} radius="xl" />
        </Group>
        <Group justify="flex-end" gap="xs">
          <Skeleton height={28} width={28} radius="sm" />
          <Skeleton height={28} width={28} radius="sm" />
        </Group>
      </Stack>
    </Card>
  );
}

export function QuizCardSkeleton() {
  return (
    <Card withBorder>
      <Stack gap="xs">
        <Skeleton height={16} width="80%" />
        <Skeleton height={12} width="100%" />
        <Skeleton height={12} width="60%" />
        <Group justify="space-between">
          <Skeleton height={20} width={80} radius="xl" />
          <Skeleton height={20} width={60} radius="xl" />
        </Group>
        <Group justify="flex-end" gap="xs">
          <Skeleton height={28} width={28} radius="sm" />
          <Skeleton height={28} width={28} radius="sm" />
        </Group>
      </Stack>
    </Card>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td><Skeleton height={12} width="80%" /></td>
      <td><Skeleton height={12} width="90%" /></td>
      <td><Skeleton height={20} width={60} radius="xl" /></td>
      <td><Skeleton height={12} width="70%" /></td>
      <td>
        <Group gap="xs">
          <Skeleton height={28} width={28} radius="sm" />
          <Skeleton height={28} width={28} radius="sm" />
        </Group>
      </td>
    </tr>
  );
}

export function ActivityItemSkeleton() {
  return (
    <Group justify="space-between">
      <Skeleton height={12} width="70%" />
      <Skeleton height={10} width="30%" />
    </Group>
  );
}

export function DashboardSkeleton() {
  return (
    <Stack gap="lg">
      <Skeleton height={32} width="200px" />
      
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </SimpleGrid>

      <Group grow align="flex-start">
        <Card withBorder>
          <Stack gap="md">
            <Skeleton height={20} width="150px" />
            <Stack gap="xs">
              {Array.from({ length: 5 }).map((_, index) => (
                <ActivityItemSkeleton key={index} />
              ))}
            </Stack>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap="md">
            <Skeleton height={20} width="120px" />
            <Stack gap="xs">
              {Array.from({ length: 3 }).map((_, index) => (
                <Group key={index} justify="space-between">
                  <Skeleton height={12} width="60%" />
                  <Skeleton height={12} width="30%" />
                </Group>
              ))}
            </Stack>
          </Stack>
        </Card>
      </Group>
    </Stack>
  );
}

export function QuestionsGridSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
      {Array.from({ length: 6 }).map((_, index) => (
        <QuestionCardSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export function QuizzesGridSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
      {Array.from({ length: 6 }).map((_, index) => (
        <QuizCardSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export function UsersTableSkeleton() {
  return (
    <Card withBorder>
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRowSkeleton key={index} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
