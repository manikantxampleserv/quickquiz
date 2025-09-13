"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconPlus, IconQuestionMark, IconTrash } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
  explanation: string;
  order?: number;
}

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

export default function QuizDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionModalOpened, setQuestionModalOpened] = useState(false);

  // Pagination state for questions
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const questionForm = useForm({
    initialValues: {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "0",
      difficulty: "medium",
      explanation: "",
    },
  });

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      const data = await response.json();

      if (data.success) {
        setQuiz(data.quiz);
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to fetch quiz details",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch quiz details",
        color: "red",
      });
    }
  };

  const fetchQuestions = async (page = 1) => {
    setQuestionsLoading(true);
    try {
      const response = await fetch(
        `/api/quizzes/${quizId}/questions?page=${page}&limit=${pageSize}`
      );
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(page);
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to fetch questions",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch questions",
        color: "red",
      });
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCreateQuestion = async (values: any) => {
    const questionData = {
      ...values,
      correctAnswer: parseInt(values.correctAnswer),
    };
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuestions(currentPage);
        questionForm.reset();
        setQuestionModalOpened(false);
        notifications.show({
          title: "Success",
          message: "Question added successfully!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to add question",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error creating question:", error);
      notifications.show({
        title: "Error",
        message: "Failed to add question",
        color: "red",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuestions(currentPage);
        notifications.show({
          title: "Success",
          message: "Question deleted successfully!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to delete question",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete question",
        color: "red",
      });
    }
  };

  useEffect(() => {
    if (quizId) {
      Promise.all([fetchQuiz(), fetchQuestions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [quizId]);

  if (loading) {
    return (
      <Stack>
        <Center>
          <Loader size="lg" />
        </Center>
      </Stack>
    );
  }

  if (!quiz) {
    return (
      <Stack>
        <Center>
          <Text>Quiz not found</Text>
        </Center>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        {/* Quiz Header */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Title order={2}>{quiz.title}</Title>
                <Text c="dimmed" mt="xs">
                  {quiz.description || "No description provided"}
                </Text>
              </div>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size="1rem" />}
                onClick={() => router.push("/admin/quizzes")}
              >
                Back to Quizzes
              </Button>
            </Group>

            <Group>
              <Badge data-theme-accent size="lg">
                {quiz.timeLimit} minutes
              </Badge>
              <Badge color={quiz.isPublic ? "green" : "orange"} size="lg">
                {quiz.isPublic ? "Public" : "Private"}
              </Badge>
              <Badge variant="light" size="lg">
                {questions.length} questions
              </Badge>
            </Group>
          </Stack>
        </Card>

        {/* Questions Section */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Questions</Title>
              <Button
                leftSection={<IconPlus size="1rem" />}
                onClick={() => setQuestionModalOpened(true)}
              >
                Add Question
              </Button>
            </Group>

            <Divider />

            {questionsLoading ? (
              <Center py="xl">
                <Loader />
              </Center>
            ) : questions.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <IconQuestionMark size="3rem" color="gray" />
                  <Text c="dimmed">No questions yet. Add your first question!</Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="md">
                {questions.map((question, index) => (
                  <Card key={question.id || index} withBorder padding="md">
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Text fw={500} style={{ flex: 1 }}>
                          {index + 1 + (currentPage - 1) * pageSize}. {question.question}
                        </Text>
                        <Group gap="xs">
                          <Badge
                            data-theme-accent={question.difficulty === "medium"}
                            color={
                              question.difficulty === "easy"
                                ? "green"
                                : question.difficulty === "hard"
                                ? "red"
                                : undefined
                            }
                            size="sm"
                          >
                            {question.difficulty}
                          </Badge>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => question.id && handleDeleteQuestion(question.id)}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Stack gap="xs">
                        {question.options.map((option, optionIndex) => (
                          <Group key={optionIndex} gap="sm">
                            <Text
                              size="sm"
                              fw={optionIndex === question.correctAnswer ? 600 : 400}
                              c={optionIndex === question.correctAnswer ? "green" : undefined}
                            >
                              {String.fromCharCode(65 + optionIndex)}. {option}
                              {optionIndex === question.correctAnswer && " ✓"}
                            </Text>
                          </Group>
                        ))}
                      </Stack>

                      {question.explanation && (
                        <Text size="sm" c="dimmed" fs="italic">
                          Explanation: {question.explanation}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}

                {totalPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination
                      value={currentPage}
                      onChange={(page) => fetchQuestions(page)}
                      total={totalPages}
                      size="sm"
                    />
                  </Group>
                )}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Question Modal */}
      <Modal
        opened={questionModalOpened}
        onClose={() => setQuestionModalOpened(false)}
        title={`Add Question to "${quiz.title}"`}
        size="lg"
      >
        <form onSubmit={questionForm.onSubmit(handleCreateQuestion)}>
          <Stack gap="md">
            <TextInput
              label="Question"
              placeholder="Enter your question"
              {...questionForm.getInputProps("question")}
              required
            />

            <Text size="sm" fw={500}>
              Options
            </Text>
            {questionForm.values.options.map((option: string, index: number) => (
              <TextInput
                key={index}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                {...questionForm.getInputProps(`options.${index}`)}
                required
              />
            ))}

            <Group grow>
              <Select
                label="Correct Answer"
                data={questionForm.values.options.map((option: string, index: number) => ({
                  value: index.toString(),
                  label: `${String.fromCharCode(65 + index)}: ${option || `Option ${index + 1}`}`,
                }))}
                {...questionForm.getInputProps("correctAnswer")}
                required
              />
              <Select
                label="Difficulty"
                data={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
                {...questionForm.getInputProps("difficulty")}
                required
              />
            </Group>

            <Textarea
              label="Explanation (Optional)"
              placeholder="Explain why this answer is correct"
              {...questionForm.getInputProps("explanation")}
              minRows={3}
            />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setQuestionModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Question</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
