"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
  IconRobot,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { QuizzesGridSkeleton } from "../components/SkeletonLoaders";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
  category: string;
  explanation: string;
  quizId?: string;
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

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizModalOpened, setQuizModalOpened] = useState(false);
  const [questionModalOpened, setQuestionModalOpened] = useState(false);
  const [selectedQuizForQuestion, setSelectedQuizForQuestion] =
    useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(6);

  // Question form state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratingAnswer, setAiGeneratingAnswer] = useState(false);
  const [aiGeneratingExplanation, setAiGeneratingExplanation] = useState(false);

  const quizForm = useForm({
    initialValues: {
      title: "",
      description: "",
      timeLimit: 30,
      isPublic: true,
    },
  });

  const questionForm = useForm<Question>({
    initialValues: {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      difficulty: "medium",
      category: "General",
      explanation: "",
    },
  });

  const fetchQuizzes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/quizzes?page=${page}&limit=${pageSize}&includeCount=true`
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
      const response = await fetch(`/api/quizzes/${quizId}`, {
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

    quizForm.setValues({
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      isPublic: quiz.isPublic,
    });
    setQuizModalOpened(true);
  };

  const handleAddQuestion = (quiz: Quiz) => {
    setSelectedQuizForQuestion(quiz);
    questionForm.setFieldValue("category", quiz.title);
    setQuestionModalOpened(true);
  };

  const generateAIQuestion = async (topic: string, category: string) => {
    setAiGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty: questionForm.values.difficulty || "medium",
        }),
      });

      const data = await response.json();

      if (data.success && data.question) {
        const options = Array.isArray(data.question.options)
          ? data.question.options
          : ["", "", "", ""];

        // Find correct answer index by matching the correct answer text with options
        let correctAnswerIndex = 0;
        if (data.question.correctAnswer !== undefined) {
          if (typeof data.question.correctAnswer === "number") {
            correctAnswerIndex = data.question.correctAnswer;
          } else if (typeof data.question.correctAnswer === "string") {
            // Try to find the option that matches the correct answer text
            const matchIndex = options.findIndex(
              (option: string) =>
                option
                  .toLowerCase()
                  .includes(data.question.correctAnswer.toLowerCase()) ||
                data.question.correctAnswer
                  .toLowerCase()
                  .includes(option.toLowerCase())
            );
            correctAnswerIndex = matchIndex >= 0 ? matchIndex : 0;
          }
        }

        questionForm.setValues({
          question: data.question.question || "",
          options: options,
          correctAnswer: correctAnswerIndex,
          difficulty:
            data.question.difficulty ||
            questionForm.values.difficulty ||
            "medium",
          category: category,
          explanation: data.question.explanation || "",
        });

        notifications.show({
          title: "Success",
          message: "AI question with answer and explanation generated!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to generate AI question",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error generating AI question:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate AI question",
        color: "red",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateAIAnswer = async () => {
    if (!questionForm.values.question) {
      notifications.show({
        title: "Error",
        message: "Please enter a question first",
        color: "red",
      });
      return;
    }

    setAiGeneratingAnswer(true);
    try {
      const response = await fetch("/api/ai/generate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionForm.values.question,
          options: questionForm.values.options.filter(
            (opt) => opt.trim() !== ""
          ),
        }),
      });

      const data = await response.json();

      if (data.success) {
        questionForm.setFieldValue("correctAnswer", data.correctAnswer);
        notifications.show({
          title: "Success",
          message: "AI generated correct answer!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to generate answer",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error generating AI answer:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate answer",
        color: "red",
      });
    } finally {
      setAiGeneratingAnswer(false);
    }
  };

  const generateAIExplanation = async () => {
    if (
      !questionForm.values.question ||
      questionForm.values.options.filter((opt) => opt.trim() !== "").length < 2
    ) {
      notifications.show({
        title: "Error",
        message: "Please enter question and options first",
        color: "red",
      });
      return;
    }

    setAiGeneratingExplanation(true);
    try {
      const response = await fetch("/api/ai/generate-explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionForm.values.question,
          options: questionForm.values.options,
          correctAnswer: questionForm.values.correctAnswer,
        }),
      });

      const data = await response.json();

      if (data.success) {
        questionForm.setFieldValue("explanation", data.explanation);
        notifications.show({
          title: "Success",
          message: "AI generated explanation!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "Failed to generate explanation",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate explanation",
        color: "red",
      });
    } finally {
      setAiGeneratingExplanation(false);
    }
  };

  const handleCreateQuestion = async (values: Question) => {
    if (!selectedQuizForQuestion?.id) return;

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          quizId: selectedQuizForQuestion.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuizzes();
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

  const handleCreateQuiz = async (values: any) => {
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
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
        notifications.show({
          title: "Success",
          message: "Quiz created successfully!",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to create quiz",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create quiz",
        color: "red",
      });
    }
  };

  useEffect(() => {
    fetchQuizzes(1);
  }, []);

  return (
    <Container size="xl">
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
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start">
                      <Text fw={500} style={{ flex: 1 }}>
                        {quiz.title}
                      </Text>

                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/admin/questions?quizId=${
                            quiz.id
                          }&quizTitle=${encodeURIComponent(quiz.title)}`)
                        }
                        title="View Quiz"
                      >
                        <IconEye size="1rem" />
                      </ActionIcon>
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {quiz.description}
                    </Text>

                    <Group justify="space-between">
                      <Badge size="xs" variant="light">
                        {quiz._count?.questions || 0} questions
                      </Badge>
                      <Badge data-theme-accent size="xs">
                        {quiz.timeLimit} min
                      </Badge>
                      <Badge
                        color={quiz.isPublic ? "green" : "orange"}
                        size="xs"
                      >
                        {quiz.isPublic ? "Public" : "Private"}
                      </Badge>
                    </Group>

                    <Group justify="space-between" mt="xs">
                      <Group gap="xs">
                        <Button
                          variant="light"
                          size="xs"
                          leftSection={<IconPlus size="0.8rem" />}
                          onClick={() => handleAddQuestion(quiz)}
                        >
                          Add Question
                        </Button>
                      </Group>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={() => handleEditQuiz(quiz)}
                          title="Edit Quiz"
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => quiz.id && handleDeleteQuiz(quiz.id)}
                          title="Delete Quiz"
                        >
                          <IconTrash size="1rem" />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              ))}
              {quizzes.length === 0 && !loading && (
                <Card withBorder>
                  <Text c="dimmed" ta="center">
                    No quizzes available. Create your first quiz!
                  </Text>
                </Card>
              )}
            </SimpleGrid>

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
        title="Create New Quiz"
        size="lg"
      >
        <form onSubmit={quizForm.onSubmit(handleCreateQuiz)}>
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
              Questions will be added to this quiz category after creation. Use
              the Question Bank to add questions to this quiz.
            </Text>

            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => setQuizModalOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Quiz</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Question Modal */}
      <Modal
        opened={questionModalOpened}
        onClose={() => setQuestionModalOpened(false)}
        title={`Add Question to "${selectedQuizForQuestion?.title}"`}
        size="lg"
      >
        <form onSubmit={questionForm.onSubmit(handleCreateQuestion)}>
          <Stack gap="sm">
            <Group grow>
              <Button
                variant="light"
                onClick={() =>
                  generateAIQuestion(
                    selectedQuizForQuestion?.title || "General",
                    selectedQuizForQuestion?.title || "General"
                  )
                }
                loading={aiGenerating}
                leftSection={<IconRobot size="1rem" />}
              >
                Generate Question with AI
              </Button>
            </Group>
            <TextInput
              label="Question"
              placeholder="Enter your question"
              {...questionForm.getInputProps("question")}
              required
            />

            <Text size="sm" fw={500}>
              Options
            </Text>
            {questionForm.values.options.map(
              (option: string, index: number) => (
                <TextInput
                  key={index}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  {...questionForm.getInputProps(`options.${index}`)}
                  required
                />
              )
            )}
            <Group grow>
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
              <TextInput
                label="Category"
                placeholder="e.g., General Knowledge"
                {...questionForm.getInputProps("category")}
                required
              />
            </Group>

            <Button
              variant="light"
              onClick={async () => {
                await generateAIAnswer();
                await generateAIExplanation();
              }}
              loading={aiGeneratingAnswer || aiGeneratingExplanation}
              leftSection={<IconRobot size="1rem" />}
              mt="sm"
            >
              AI Answer & Explanation
            </Button>
            <Select
              label="Correct Answer"
              data={questionForm.values.options.map(
                (option: string, index: number) => ({
                  value: index.toString(),
                  label: `${String.fromCharCode(65 + index)}: ${
                    option || `Option ${index + 1}`
                  }`,
                })
              )}
              {...questionForm.getInputProps("correctAnswer")}
              required
            />

            <Textarea
              label="Explanation"
              placeholder="Explain why this answer is correct"
              {...questionForm.getInputProps("explanation")}
              minRows={5}
            />

            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => setQuestionModalOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={aiGenerating}>
                Add Question
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
