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
  IconBulb,
  IconEdit,
  IconEye,
  IconPlus,
  IconRobot,
  IconTrash,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QuestionsGridSkeleton } from "../components/SkeletonLoaders";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  explanation: string;
  quizId?: string;
  title?: string;
  quizzes?: Array<{
    id: string;
    title: string;
  }>;
  quizCount?: number;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

const QuestionsPageContent = () => {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [questionModalOpened, setQuestionModalOpened] = useState(false);
  const [quizSelectionModalOpened, setQuizSelectionModalOpened] =
    useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>("");
  const [bulkModalOpened, setBulkModalOpened] = useState(false);
  const [previewModalOpened, setPreviewModalOpened] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [questionDetailModalOpened, setQuestionDetailModalOpened] =
    useState(false);
  const [selectedQuestionForPreview, setSelectedQuestionForPreview] =
    useState<Question | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratingAnswerExplanation, setAiGeneratingAnswerExplanation] =
    useState(false);
  const [loading, setLoading] = useState(true);

  const questionForm = useForm<Question>({
    initialValues: {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "0",
      difficulty: "medium",
      explanation: "",
    },
  });

  const quizSelectionForm = useForm({
    initialValues: {
      selectedQuiz: "",
      createNew: false,
      newQuizTitle: "",
      newQuizDescription: "",
    },
  });

  const bulkForm = useForm({
    initialValues: {
      quizId: "",
      count: 10,
    },
  });

  const fetchQuestions = async () => {
    try {
      let url = "/api/v1/questions";
      if (selectedQuizId) {
        url = `/api/v1/quizzes/${selectedQuizId}/questions`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        const questionsWithQuizTitles = await Promise.all(
          (data.questions || []).map(async (question: Question) => {
            if (question.quizId && !selectedQuizId) {
              try {
                const quizResponse = await fetch(
                  `/api/v1/quizzes/${question.quizId}`
                );
                const quizData = await quizResponse.json();
                if (quizData.success) {
                  return { ...question, title: quizData.quiz.title };
                }
              } catch (error) {
                console.error("Error fetching quiz title:", error);
              }
            } else if (selectedQuizId) {
              const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
              return { ...question, title: selectedQuiz?.title };
            }
            return question;
          })
        );
        setQuestions(questionsWithQuizTitles);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(`/api/v1/questions/${questionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuestions();
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

  const handleEditQuestion = (question: Question) => {
    if (!question.id) return;

    const cleanOptions = (question.options || []).map((option: string) => {
      return option.replace(/^[A-D]\.\s*/, "");
    });

    questionForm.setValues({
      ...question,
      options: [...cleanOptions, "", "", ""].slice(0, 4),
      correctAnswer: String(question.correctAnswer),
    });
    setSelectedQuizId(question.quizId || "");
    setQuestionModalOpened(true);
  };

  const handlePreviewQuestion = (question: Question) => {
    setSelectedQuestionForPreview(question);
    setQuestionDetailModalOpened(true);
  };

  const handleCreateQuestion = async (values: Question) => {
    try {
      const isEdit = !!values.id;
      const url = isEdit
        ? `/api/v1/questions/${values.id}`
        : "/api/v1/questions";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          quizId: selectedQuizId || values.quizId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuestions();
        questionForm.reset();
        setQuestionModalOpened(false);
        setSelectedQuizId("");
        notifications.show({
          title: "Success",
          message: `Question ${isEdit ? "updated" : "saved"} successfully!`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message:
            data.error || `Failed to ${isEdit ? "update" : "save"} question`,
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error creating question:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save question",
        color: "red",
      });
    }
  };

  const generateAIQuestion = async (topic: string) => {
    setAiGenerating(true);
    try {
      const response = await fetch("/api/v1/ai/generate-question", {
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

        let correctAnswerIndex = 0;

        if (data.question.correctAnswer !== undefined) {
          if (typeof data.question.correctAnswer === "number") {
            correctAnswerIndex = data.question.correctAnswer;
          } else if (typeof data.question.correctAnswer === "string") {
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
          correctAnswer: correctAnswerIndex.toString(),
          difficulty:
            data.question.difficulty ||
            questionForm.values.difficulty ||
            "medium",
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

  const handleBulkGenerate = async (values: any) => {
    setAiGenerating(true);
    try {
      const selectedQuiz = quizzes.find((quiz) => quiz.id === values.quizId);
      const quizTitle = selectedQuiz?.title || "General Questions";

      const response = await fetch("/api/v1/ai/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: quizTitle,
          difficulty: "medium",
          count: values.count,
        }),
      });

      const data = await response.json();

      if (data.success && data.questions) {
        setPreviewQuestions(data.questions);
        setBulkModalOpened(false);
        setPreviewModalOpened(true);
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to generate questions",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error generating bulk questions:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate questions",
        color: "red",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleBulkSave = async (selectedIndices?: number[]) => {
    try {
      const questionsToSave = selectedIndices
        ? previewQuestions.filter((_, index) => selectedIndices.includes(index))
        : previewQuestions;

      const response = await fetch("/api/v1/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: questionsToSave,
          quizId: bulkForm.values.quizId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuestions();
        setPreviewModalOpened(false);
        setPreviewQuestions([]);
        setSelectedQuestions(new Set());
        notifications.show({
          title: "Success",
          message: `Successfully added ${questionsToSave.length} questions!`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to save questions",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save questions",
        color: "red",
      });
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/v1/quizzes");
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const generateAIAnswerAndExplanation = async (
    mode: "answer" | "explanation" | "both" = "both"
  ) => {
    if (!questionForm.values.question) {
      notifications.show({
        title: "Error",
        message: "Please enter a question first",
        color: "red",
      });
      return;
    }

    setAiGeneratingAnswerExplanation(true);

    try {
      const requestBody: any = {
        question: questionForm.values.question,
        options: questionForm.values.options.filter((opt) => opt.trim() !== ""),
        mode,
      };

      // For explanation mode, we need the correct answer
      if (mode === "explanation") {
        requestBody.correctAnswer = parseInt(questionForm.values.correctAnswer);
      }

      const response = await fetch("/api/v1/ai/generate-answer-explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        if (data.correctAnswer !== undefined) {
          // Ensure the correct answer index is valid (0-3) and within the available options
          const correctAnswerIndex = parseInt(data.correctAnswer.toString());
          const availableOptions = questionForm.values.options.filter(
            (opt) => opt.trim() !== ""
          );

          if (
            correctAnswerIndex >= 0 &&
            correctAnswerIndex < availableOptions.length
          ) {
            questionForm.setFieldValue(
              "correctAnswer",
              correctAnswerIndex.toString()
            );
          }
        }

        if (data.explanation) {
          questionForm.setFieldValue("explanation", data.explanation);
        }

        let message = "";
        if (mode === "both") {
          message = "AI generated answer and explanation!";
        } else if (mode === "answer") {
          message = "AI generated correct answer!";
        } else {
          message = "AI generated explanation!";
        }

        notifications.show({
          title: "Success",
          message,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to generate AI content",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error generating AI content:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate AI content",
        color: "red",
      });
    } finally {
      setAiGeneratingAnswerExplanation(false);
    }
  };

  const handleQuizSelection = (values: any) => {
    if (values.createNew) {
      createNewQuiz(values.newQuizTitle, values.newQuizDescription);
    } else {
      setSelectedQuizId(values.selectedQuiz);
      setQuizSelectionModalOpened(false);
      setQuestionModalOpened(true);
    }
  };

  const createNewQuiz = async (title: string, description: string) => {
    try {
      const response = await fetch("/api/v1/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          timeLimit: 30,
          isPublic: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchQuizzes();
        setSelectedQuizId(data.quiz.id);
        setQuizSelectionModalOpened(false);
        setQuestionModalOpened(true);
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
    const loadData = async () => {
      setLoading(true);
      await fetchQuizzes();

      const quizId = searchParams.get("quizId");
      const quizTitle = searchParams.get("quizTitle");

      if (quizId) {
        setSelectedQuizId(quizId);
      }
      if (quizTitle) {
        setSelectedQuizTitle(decodeURIComponent(quizTitle));
      }

      setLoading(false);
    };
    loadData();
  }, [searchParams]);

  useEffect(() => {
    if (quizzes.length > 0) {
      fetchQuestions();
    }
  }, [selectedQuizId, quizzes]);

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>
            {selectedQuizTitle
              ? `${selectedQuizTitle} - Questions`
              : "Question Bank"}
          </Title>
          <Group>
            <Button
              leftSection={<IconBulb size="1rem" />}
              onClick={() => setBulkModalOpened(true)}
              variant="light"
            >
              Bulk Generate
            </Button>
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => {
                if (selectedQuizId) {
                  questionForm.setFieldValue("category", selectedQuizTitle);
                  setQuestionModalOpened(true);
                } else {
                  setQuizSelectionModalOpened(true);
                }
              }}
            >
              Add Question
            </Button>
          </Group>
        </Group>

        {loading ? (
          <QuestionsGridSkeleton />
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {questions.map((question: Question, index: number) => (
              <Card key={question.id || index} withBorder>
                <Stack gap="xs" justify="space-between" mih={115}>
                  <Stack>
                    <Text fw={500} lineClamp={2}>
                      {question.question}
                    </Text>
                    <Group justify="space-between" align="center">
                      <Badge size="xs" data-theme-accent>
                        {question.difficulty}
                      </Badge>
                    </Group>
                  </Stack>

                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      {!selectedQuizId &&
                      question.quizzes &&
                      question.quizzes.length > 0 ? (
                        <Group gap="xs" wrap="wrap">
                          {question.quizzes.slice(0, 2).map((quiz: any) => (
                            <Badge
                              key={quiz.id}
                              size="xs"
                              variant="light"
                              color="blue"
                            >
                              {quiz.title}
                            </Badge>
                          ))}
                          {question.quizzes.length > 2 && (
                            <Badge size="xs" variant="light" color="gray">
                              +{question.quizzes.length - 2} more
                            </Badge>
                          )}
                        </Group>
                      ) : question.title ? (
                        <Badge size="xs" variant="light" color="blue">
                          {question.title}
                        </Badge>
                      ) : !selectedQuizId ? (
                        <Badge size="xs" variant="light" color="gray">
                          No Quiz
                        </Badge>
                      ) : null}
                    </Group>
                    <Group justify="flex-end" gap="xs">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => handlePreviewQuestion(question)}
                        title="Preview Question"
                      >
                        <IconEye size="0.8rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                        title="Edit Question"
                      >
                        <IconEdit size="0.8rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() =>
                          question.id && handleDeleteQuestion(question.id)
                        }
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
        )}
        {questions.length === 0 && !loading && (
          <Card withBorder p="xl" bg="gray.0">
            <Stack align="center" gap="md">
              <IconPlus size="3rem" color="gray" />
              <Stack align="center" gap="xs">
                <Text size="lg" fw={600} c="dimmed">
                  Ready to create your first question?
                </Text>
                <Text size="sm" c="dimmed" ta="center" maw={400}>
                  Build engaging questions with multiple choice answers, set
                  difficulty levels, and add explanations. Get started by
                  clicking the "Create Question" button above.
                </Text>
              </Stack>
              <Button
                leftSection={<IconPlus size="1rem" />}
                onClick={() => setQuestionModalOpened(true)}
                size="md"
              >
                Create Your First Question
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Question Modal */}
      <Modal
        opened={questionModalOpened}
        onClose={() => setQuestionModalOpened(false)}
        title={questionForm.values.id ? "Edit Question" : "Add New Question"}
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
        <form onSubmit={questionForm.onSubmit(handleCreateQuestion)}>
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <Stack gap="md">
              <Button
                variant="light"
                onClick={() => {
                  const selectedQuiz = quizzes.find(
                    (q) => q.id === selectedQuizId
                  );
                  const topic = selectedQuiz
                    ? selectedQuiz.title
                    : "General Knowledge";
                  generateAIQuestion(topic);
                }}
                loading={aiGenerating}
                leftSection={<IconRobot size="1rem" />}
              >
                Generate Question with AI
              </Button>

              <Textarea
                rows={3}
                label="Question"
                placeholder="Enter your question"
                {...questionForm.getInputProps("question")}
                required
              />

              <Text size="sm" fw={500}>
                Options
              </Text>
              {(questionForm.values.options || ["", "", "", ""]).map(
                (option: string, index: number) => (
                  <div key={index}>
                    <TextInput
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      {...questionForm.getInputProps(`options.${index}`)}
                      required
                    />
                  </div>
                )
              )}

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

              <Button
                variant="light"
                onClick={() => generateAIAnswerAndExplanation("both")}
                loading={aiGeneratingAnswerExplanation}
                leftSection={<IconRobot size="1rem" />}
              >
                AI Answer & Explanation
              </Button>

              <Select
                label="Correct Answer"
                data={questionForm.values.options
                  .filter((option: string) => option.trim() !== "")
                  .map((option: string, index: number) => ({
                    value: index.toString(),
                    label: `${String.fromCharCode(65 + index)}) ${option}`,
                  }))}
                {...questionForm.getInputProps("correctAnswer")}
                required
              />

              <Textarea
                label="Explanation"
                placeholder="Explain why this answer is correct"
                {...questionForm.getInputProps("explanation")}
                rows={3}
              />
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
                onClick={() => setQuestionModalOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Question</Button>
            </Group>
          </div>
        </form>
      </Modal>

      {/* Bulk Generation Modal */}
      <Modal
        opened={bulkModalOpened}
        onClose={() => setBulkModalOpened(false)}
        title="Bulk Question Generation"
        size="md"
        styles={{
          header: {
            borderBottom: "1px solid var(--mantine-color-gray-3)",
          },
          body: {
            padding: "0 0 1rem 0",
          },
        }}
      >
        <form onSubmit={bulkForm.onSubmit(handleBulkGenerate)}>
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <Stack gap="md">
              <Select
                label="Select Quiz"
                description="Choose a quiz to generate questions for"
                placeholder="Select a quiz category"
                data={quizzes.map((quiz) => ({
                  value: quiz.id,
                  label: quiz.title,
                }))}
                {...bulkForm.getInputProps("quizId")}
                required
              />

              <NumberInput
                label="Number of Questions"
                description="How many questions to generate (1-50)"
                min={1}
                max={50}
                {...bulkForm.getInputProps("count")}
                required
              />
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
                onClick={() => setBulkModalOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={aiGenerating}>
                Generate Questions
              </Button>
            </Group>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        opened={previewModalOpened}
        onClose={() => {
          setPreviewModalOpened(false);
          setSelectedQuestions(new Set());
        }}
        title="Preview Generated Questions"
        size="xl"
        styles={{
          header: {
            borderBottom: "1px solid var(--mantine-color-gray-3)",
          },
          body: {
            padding: "0 0 1rem 0",
          },
        }}
      >
        <div
          style={{
            maxHeight: "70vh",
            overflowY: "auto",
            padding: "24px",
          }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Review the generated questions before adding them to your
                question bank.
              </Text>
              <Button
                size="xs"
                variant="light"
                onClick={() => {
                  if (selectedQuestions.size === previewQuestions.length) {
                    setSelectedQuestions(new Set());
                  } else {
                    setSelectedQuestions(
                      new Set(previewQuestions.map((_, i) => i))
                    );
                  }
                }}
              >
                {selectedQuestions.size === previewQuestions.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </Group>

            <Stack gap="lg">
              {previewQuestions.map((question: Question, index: number) => (
                <Card key={index} withBorder p="md">
                  <Group align="flex-start" gap="md">
                    <Checkbox
                      checked={selectedQuestions.has(index)}
                      onChange={(event) => {
                        const newSelected = new Set(selectedQuestions);
                        if (event.currentTarget.checked) {
                          newSelected.add(index);
                        } else {
                          newSelected.delete(index);
                        }
                        setSelectedQuestions(newSelected);
                      }}
                      mt={4}
                    />
                    <Stack gap="md" style={{ flex: 1 }}>
                      <Text
                        fw={500}
                        size="md"
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }}
                      >
                        {index + 1}. {question.question}
                      </Text>

                      <Stack gap="xs">
                        <Text size="sm" fw={500} c="dimmed">
                          Options:
                        </Text>
                        {question.options.map(
                          (option: string, optIndex: number) => (
                            <Text
                              key={optIndex}
                              size="sm"
                              c={
                                optIndex === parseInt(question.correctAnswer)
                                  ? "green"
                                  : "dark"
                              }
                              fw={
                                optIndex === parseInt(question.correctAnswer)
                                  ? 600
                                  : 400
                              }
                              style={{
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.4,
                                padding: "4px 8px",
                                backgroundColor:
                                  optIndex === parseInt(question.correctAnswer)
                                    ? "var(--mantine-color-green-0)"
                                    : "transparent",
                                borderRadius: "4px",
                              }}
                            >
                              {String.fromCharCode(65 + optIndex)}) {option}
                            </Text>
                          )
                        )}
                      </Stack>

                      {question.explanation && (
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">
                            Explanation:
                          </Text>
                          <Text
                            size="sm"
                            c="blue"
                            style={{
                              wordBreak: "break-word",
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.4,
                              fontStyle: "italic",
                              padding: "8px 12px",
                              backgroundColor: "var(--mantine-color-blue-0)",
                              borderRadius: "4px",
                              border: "1px solid var(--mantine-color-blue-2)",
                            }}
                          >
                            {question.explanation}
                          </Text>
                        </Stack>
                      )}
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--mantine-color-gray-3)",
            padding: "1rem 24px 0 24px",
          }}
        >
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Total: {previewQuestions.length} questions | Selected:{" "}
              {selectedQuestions.size}
            </Text>
            <Group>
              <Button
                variant="subtle"
                onClick={() => {
                  setPreviewModalOpened(false);
                  setSelectedQuestions(new Set());
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleBulkSave(Array.from(selectedQuestions))}
                leftSection={<IconPlus size="1rem" />}
                disabled={selectedQuestions.size === 0}
              >
                Add Selected Questions ({selectedQuestions.size})
              </Button>
            </Group>
          </Group>
        </div>
      </Modal>

      {/* Quiz Selection Modal */}
      <Modal
        opened={quizSelectionModalOpened}
        onClose={() => setQuizSelectionModalOpened(false)}
        title="Select Quiz Category"
        size="md"
        styles={{
          header: {
            borderBottom: "1px solid var(--mantine-color-gray-3)",
          },
          body: {
            padding: "0 0 1rem 0",
          },
        }}
      >
        <form onSubmit={quizSelectionForm.onSubmit(handleQuizSelection)}>
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Questions are organized by quiz categories. Select an existing
                quiz or create a new one.
              </Text>

              <Checkbox
                label="Create new quiz category"
                {...quizSelectionForm.getInputProps("createNew", {
                  type: "checkbox",
                })}
              />

              {!quizSelectionForm.values.createNew ? (
                <Select
                  label="Select Quiz"
                  placeholder="Choose a quiz category"
                  data={quizzes.map((quiz) => ({
                    value: quiz.id,
                    label: quiz.title,
                  }))}
                  {...quizSelectionForm.getInputProps("selectedQuiz")}
                  required={!quizSelectionForm.values.createNew}
                />
              ) : (
                <Stack gap="md">
                  <TextInput
                    label="Quiz Title"
                    placeholder="Enter quiz category name"
                    {...quizSelectionForm.getInputProps("newQuizTitle")}
                    required={quizSelectionForm.values.createNew}
                  />
                  <Textarea
                    label="Quiz Description"
                    placeholder="Enter quiz description"
                    {...quizSelectionForm.getInputProps("newQuizDescription")}
                  />
                </Stack>
              )}
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
                onClick={() => setQuizSelectionModalOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </Group>
          </div>
        </form>
      </Modal>

      {/* Question Detail Preview Modal */}
      <Modal
        opened={questionDetailModalOpened}
        onClose={() => setQuestionDetailModalOpened(false)}
        title="Question Details"
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
        {selectedQuestionForPreview && (
          <>
            <div
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                padding: "24px",
              }}
            >
              <Stack gap="md">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    Question
                  </Text>
                  <Text
                    fw={500}
                    size="md"
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedQuestionForPreview.question}
                  </Text>
                </div>

                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    Options
                  </Text>
                  <Stack gap="sm">
                    {selectedQuestionForPreview.options
                      ?.filter((option) => option && option.trim() !== "")
                      .map((option: string, index: number) => (
                        <Card
                          key={index}
                          withBorder
                          padding="md"
                          style={{
                            backgroundColor:
                              index ===
                              parseInt(selectedQuestionForPreview.correctAnswer)
                                ? "var(--mantine-color-green-0)"
                                : undefined,
                            borderColor:
                              index ===
                              parseInt(selectedQuestionForPreview.correctAnswer)
                                ? "var(--mantine-color-green-6)"
                                : undefined,
                            borderWidth:
                              index ===
                              parseInt(selectedQuestionForPreview.correctAnswer)
                                ? 2
                                : 1,
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Text
                              size="sm"
                              fw={
                                index ===
                                parseInt(
                                  selectedQuestionForPreview.correctAnswer
                                )
                                  ? 600
                                  : 400
                              }
                              style={{
                                flex: 1,
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.4,
                              }}
                            >
                              {String.fromCharCode(65 + index)}) {option}
                            </Text>
                            {index ===
                              parseInt(
                                selectedQuestionForPreview.correctAnswer
                              ) && (
                              <Badge size="sm" color="green" variant="filled">
                                ✓ Correct Answer
                              </Badge>
                            )}
                          </Group>
                        </Card>
                      ))}
                  </Stack>
                </div>

                <Group>
                  <div>
                    <Text size="sm" c="dimmed">
                      Difficulty
                    </Text>
                    <Badge data-theme-accent size="sm">
                      {selectedQuestionForPreview.difficulty}
                    </Badge>
                  </div>
                </Group>

                {selectedQuestionForPreview.explanation && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Explanation
                    </Text>
                    <Card withBorder padding="md">
                      <Text
                        size="sm"
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.4,
                        }}
                      >
                        {selectedQuestionForPreview.explanation}
                      </Text>
                    </Card>
                  </div>
                )}
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
                  onClick={() => setQuestionDetailModalOpened(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setQuestionDetailModalOpened(false);
                    handleEditQuestion(selectedQuestionForPreview);
                  }}
                  leftSection={<IconEdit size="1rem" />}
                >
                  Edit Question
                </Button>
              </Group>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

const QuestionsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionsPageContent />
    </Suspense>
  );
};

export default QuestionsPage;
