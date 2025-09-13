"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Table,
  Card,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  ActionIcon,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { UsersTableSkeleton } from "../components/SkeletonLoaders";

interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/v1/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>User Management</Title>
          <Button leftSection={<IconPlus size="1rem" />}>
            Add User
          </Button>
        </Group>

        {loading ? (
          <UsersTableSkeleton />
        ) : (
          <Card withBorder>
            {users.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map((user: User, index: number) => (
                    <Table.Tr key={user.id || index}>
                      <Table.Td>{user.name}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={user.role === 'ADMIN' ? 'red' : 'blue'}>
                          {user.role || 'USER'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon variant="light" size="sm">
                            <IconEdit size="0.8rem" />
                          </ActionIcon>
                          <ActionIcon variant="light" color="red" size="sm">
                            <IconTrash size="0.8rem" />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No users found. Add your first user!
              </Text>
            )}
          </Card>
        )}
      </Stack>
    </Container>
  );
}
