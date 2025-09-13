"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconEye, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { QuizzesGridSkeleton } from "../components/SkeletonLoaders";

interface Quiz {
  id?: string;
  title: string;
  description: string;
  timeLimit: number;
  isPublic: boolean;
  createdAt?: string;
  _count?: {
    questions: number;
  };
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizModalOpened, setQuizModalOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(6);

  const quizForm = useForm({
    initialValues: {
      id: "",
      title: "",
      description: "",
      timeLimit: 30,
      isPublic: true,
    },
  });

  const fetchQuizzes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/quizzes?page=${page}&limit=${pageSize}&includeCount=true`
      );
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This will also delete all associated questions."
      )
    )
      return;

    try {
      const response = await fetch(`/api/v1/quizzes/${quizId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuizzes();
        notifications.show({
          title: "Success",
          message: "Quiz deleted successfully!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to delete quiz",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete quiz",
        color: "red",
      });
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    if (!quiz.id) return;

    setEditingQuiz(quiz);
    quizForm.setValues({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      isPublic: quiz.isPublic,
    });
    setQuizModalOpened(true);
  };

  const handleCreateOrUpdateQuiz = async (values: any) => {
    try {
      const isEditing = editingQuiz && values.id;
      const url = isEditing
        ? `/api/v1/quizzes/${values.id}`
        : "/api/v1/quizzes";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          timeLimit: values.timeLimit,
          isPublic: values.isPublic,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuizzes();
        quizForm.reset();
        setQuizModalOpened(false);
        setEditingQuiz(null);
        notifications.show({
          title: "Success",
          message: isEditing
            ? "Quiz updated successfully!"
            : "Quiz created successfully!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message:
            data.error ||
            (isEditing ? "Failed to update quiz" : "Failed to create quiz"),
          color: "red",
        });
      }
    } catch (error) {
      const isEditing = editingQuiz && values.id;
      console.error(
        isEditing ? "Error updating quiz:" : "Error creating quiz:",
        error
      );
      notifications.show({
        title: "Error",
        message: isEditing ? "Failed to update quiz" : "Failed to create quiz",
        color: "red",
      });
    }
  };

  useEffect(() => {
    fetchQuizzes(1);
  }, []);

  return (
    <Stack>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Quiz Management</Title>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={() => setQuizModalOpened(true)}
          >
            Create Quiz
          </Button>
        </Group>

        {loading ? (
          <QuizzesGridSkeleton />
        ) : (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
              {quizzes.map((quiz: Quiz, index: number) => (
                <Card key={quiz.id || index} withBorder>
                  <Stack gap="xs" justify="space-between" mih={165}>
                    <Stack>
                      <Group justify="space-between" align="flex-start">
                        <Text fw={500} style={{ flex: 1 }}>
                          {quiz.title}
                        </Text>
                      </Group>

                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {quiz.description}
                      </Text>

                      <Group justify="space-between">
                        <Badge data-theme-accent size="xs">
                          {quiz.timeLimit} min
                        </Badge>
                        <Badge
                          data-theme-accent
                          color={quiz.isPublic ? "green" : "orange"}
                          size="xs"
                        >
                          {quiz.isPublic ? "Public" : "Private"}
                        </Badge>
                      </Group>
                    </Stack>

                    <Group justify="space-between" mt="xs">
                      <Group gap="xs">
                        <Button
                          variant="light"
                          size="xs"
                          leftSection={<IconEye size="0.8rem" />}
                          onClick={() =>
                            (window.location.href = `/admin/questions?quizId=${
                              quiz.id
                            }&quizTitle=${encodeURIComponent(quiz.title)}`)
                          }
                        >
                          Question ({quiz._count?.questions || 0})
                        </Button>
                      </Group>

                      <Group justify="flex-end" gap="xs">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => handleEditQuiz(quiz)}
                          title="Edit Question"
                        >
                          <IconEdit size="0.8rem" />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          onClick={() => quiz.id && handleDeleteQuiz(quiz.id)}
                          title="Delete Question"
                        >
                          <IconTrash size="0.8rem" />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
            {quizzes.length === 0 && !loading && (
              <Card withBorder p="xl" bg="gray.0">
                <Stack align="center" gap="md">
                  <IconPlus size="3rem" color="gray" />
                  <Stack align="center" gap="xs">
                    <Text size="lg" fw={600} c="dimmed">
                      Ready to create your first quiz?
                    </Text>
                    <Text size="sm" c="dimmed" ta="center" maw={400}>
                      Build engaging quizzes with multiple choice questions, set
                      time limits, and track performance. Get started by
                      clicking the "Create Quiz" button above.
                    </Text>
                  </Stack>
                  <Button
                    leftSection={<IconPlus size="1rem" />}
                    onClick={() => setQuizModalOpened(true)}
                    size="md"
                  >
                    Create Your First Quiz
                  </Button>
                </Stack>
              </Card>
            )}

            {totalPages > 1 && (
              <Group justify="center" mt="xl">
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={(page) => fetchQuizzes(page)}
                  size="sm"
                />
              </Group>
            )}
          </Stack>
        )}
      </Stack>

      {/* Quiz Modal */}
      <Modal
        opened={quizModalOpened}
        onClose={() => setQuizModalOpened(false)}
        title={editingQuiz ? "Edit Quiz" : "Create New Quiz"}
        size="lg"
        styles={{
          header: {
            borderBottom: "1px solid var(--mantine-color-gray-3)",
          },
          body: {
            padding: "0 0 1rem 0",
          },
        }}
      >
        <form onSubmit={quizForm.onSubmit(handleCreateOrUpdateQuiz)}>
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <Stack gap="md">
              <TextInput
                label="Quiz Title"
                placeholder="Enter quiz title"
                {...quizForm.getInputProps("title")}
                required
              />

              <Textarea
                label="Description"
                placeholder="Enter quiz description"
                {...quizForm.getInputProps("description")}
                rows={3}
              />

              <Group grow>
                <NumberInput
                  label="Time Limit (minutes)"
                  min={1}
                  max={180}
                  {...quizForm.getInputProps("timeLimit")}
                  required
                />
                <Checkbox
                  label="Public Quiz"
                  description="Allow anyone to take this quiz"
                  {...quizForm.getInputProps("isPublic", { type: "checkbox" })}
                />
              </Group>

              <Text size="sm" c="dimmed">
                Questions will be added to this quiz category after creation.
                Use the Question Bank to add questions to this quiz.
              </Text>
            </Stack>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--mantine-color-gray-3)",
              padding: "1rem 24px 0 24px",
            }}
          >
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setQuizModalOpened(false);
                  setEditingQuiz(null);
                  quizForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingQuiz ? "Update Quiz" : "Create Quiz"}
              </Button>
            </Group>
          </div>
        </form>
      </Modal>
    </Stack>
  );
}
