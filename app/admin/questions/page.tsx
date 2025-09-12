"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Badge,
  Stack,
  Group,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  ActionIcon,
  NumberInput,
  Checkbox,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRobot,
  IconBulb,
  IconEye,
} from "@tabler/icons-react";
import { QuestionsGridSkeleton } from "../components/SkeletonLoaders";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  explanation: string;
  quizId?: string;
}

function QuestionsPageContent() {
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
  const [aiGeneratingAnswer, setAiGeneratingAnswer] = useState(false);
  const [aiGeneratingExplanation, setAiGeneratingExplanation] = useState(false);
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
      let url = "/api/questions";
      if (selectedQuizId) {
        url = `/api/quizzes/${selectedQuizId}/questions`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions || []);
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
      const response = await fetch(`/api/questions/${questionId}`, {
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

    questionForm.setValues({
      ...question,
      // Ensure options is always an array with at least 4 elements
      options: [...(question.options || []), "", "", ""].slice(0, 4),
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
      const url = isEdit ? `/api/questions/${values.id}` : "/api/questions";

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
      // Find the selected quiz to get its title for context
      const selectedQuiz = quizzes.find((quiz) => quiz.id === values.quizId);
      const quizTitle = selectedQuiz?.title || "General Questions";

      const response = await fetch("/api/ai/generate-question", {
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
      // If selectedIndices is provided, filter the questions
      const questionsToSave = selectedIndices
        ? previewQuestions.filter((_, index) => selectedIndices.includes(index))
        : previewQuestions;

      const response = await fetch("/api/questions/bulk", {
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
      const response = await fetch("/api/quizzes");
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
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
        const correctAnswerString = data.correctAnswer.toString();
        questionForm.setFieldValue("correctAnswer", correctAnswerString);
        console.log(
          "Setting correct answer to:",
          correctAnswerString,
          "for options:",
          questionForm.values.options
        );
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

  const handleQuizSelection = (values: any) => {
    if (values.createNew) {
      // Create new quiz first, then proceed to question creation
      createNewQuiz(values.newQuizTitle, values.newQuizDescription);
    } else {
      setSelectedQuizId(values.selectedQuiz);
      setQuizSelectionModalOpened(false);
      setQuestionModalOpened(true);
    }
  };

  const createNewQuiz = async (title: string, description: string) => {
    try {
      const response = await fetch("/api/quizzes", {
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
    // Check URL parameters for quiz filtering
    const quizId = searchParams.get("quizId");
    const quizTitle = searchParams.get("quizTitle");

    if (quizId) {
      setSelectedQuizId(quizId);
    }
    if (quizTitle) {
      setSelectedQuizTitle(decodeURIComponent(quizTitle));
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchQuestions(), fetchQuizzes()]);
      setLoading(false);
    };
    loadData();
  }, [searchParams]);

  // Refetch questions when selectedQuizId changes
  useEffect(() => {
    if (selectedQuizId !== null) {
      fetchQuestions();
    }
  }, [selectedQuizId]);

  return (
    <Container size="xl">
      <Stack gap="lg">
        {selectedQuizTitle && (
          <Breadcrumbs>
            <Anchor onClick={() => (window.location.href = "/admin/quizzes")}>
              Quiz Management
            </Anchor>
            <Text>{selectedQuizTitle}</Text>
          </Breadcrumbs>
        )}

        <Group justify="space-between">
          <Title order={2}>
            {selectedQuizTitle
              ? `${selectedQuizTitle} - Questions`
              : "Question Bank"}
          </Title>
          <Group>
            {selectedQuizTitle && (
              <Button
                variant="subtle"
                onClick={() => {
                  setSelectedQuizId(null);
                  setSelectedQuizTitle("");
                  window.history.pushState({}, "", "/admin/questions");
                }}
              >
                View All Questions
              </Button>
            )}
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
                <Stack gap="xs">
                  <Text fw={500} lineClamp={2}>
                    {question.question}
                  </Text>
                  <Badge size="xs" data-theme-accent>
                    {question.difficulty}
                  </Badge>
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
                </Stack>
              </Card>
            ))}
            {questions.length === 0 && !loading && (
              <Card withBorder>
                <Text c="dimmed" ta="center">
                  No questions available. Create your first question!
                </Text>
              </Card>
            )}
          </SimpleGrid>
        )}
      </Stack>

      {/* Question Modal */}
      <Modal
        opened={questionModalOpened}
        onClose={() => setQuestionModalOpened(false)}
        title={questionForm.values.id ? "Edit Question" : "Add New Question"}
        size="lg"
      >
        <form onSubmit={questionForm.onSubmit(handleCreateQuestion)}>
          <Stack gap="md">
            <Group grow>
              <Select
                label="Select Quiz (Optional)"
                placeholder="Choose a quiz for this question"
                data={quizzes.map((quiz) => ({
                  value: quiz.id,
                  label: quiz.title,
                }))}
                value={selectedQuizId}
                onChange={(value) => setSelectedQuizId(value)}
                clearable
              />
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
                mt="xl"
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
            {(questionForm.values.options || ["", "", "", ""]).map(
              (option: string, index: number) => (
                <TextInput
                  key={index}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  {...questionForm.getInputProps(`options.${index}`)}
                  required
                />
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
              onClick={async () => {
                try {
                  await generateAIAnswer();
                  await generateAIExplanation();
                } catch (error) {
                  console.error("Error in AI Answer & Explanation:", error);
                }
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
              <Button type="submit">Save Question</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Bulk Generation Modal */}
      <Modal
        opened={bulkModalOpened}
        onClose={() => setBulkModalOpened(false)}
        title="Bulk Question Generation"
        size="md"
      >
        <form onSubmit={bulkForm.onSubmit(handleBulkGenerate)}>
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
          </Stack>
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
      >
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              Review the generated questions before adding them to your question
              bank.
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

          <Stack gap="lg" mah={500} style={{ overflow: "auto" }}>
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
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text
                      fw={500}
                      style={{
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {index + 1}. {question.question}
                    </Text>
                    {question.options.map(
                      (option: string, optIndex: number) => (
                        <Text
                          key={optIndex}
                          size="sm"
                          c={
                            optIndex === parseInt(question.correctAnswer)
                              ? "green"
                              : "dimmed"
                          }
                          fw={
                            optIndex === parseInt(question.correctAnswer)
                              ? 500
                              : 400
                          }
                          style={{
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {String.fromCharCode(65 + optIndex)}) {option}
                        </Text>
                      )
                    )}
                    {question.explanation && (
                      <Text
                        size="xs"
                        c="blue"
                        fs="italic"
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        Explanation: {question.explanation}
                      </Text>
                    )}
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>

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
        </Stack>
      </Modal>

      {/* Quiz Selection Modal */}
      <Modal
        opened={quizSelectionModalOpened}
        onClose={() => setQuizSelectionModalOpened(false)}
        title="Select Quiz Category"
        size="md"
      >
        <form onSubmit={quizSelectionForm.onSubmit(handleQuizSelection)}>
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

            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => setQuizSelectionModalOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Question Detail Preview Modal */}
      <Modal
        opened={questionDetailModalOpened}
        onClose={() => setQuestionDetailModalOpened(false)}
        title="Question Details"
        size="lg"
      >
        {selectedQuestionForPreview && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Question
              </Text>
              <Text fw={500} size="md">
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
                            ? "var(--mantine-color-green-light)"
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
                            parseInt(selectedQuestionForPreview.correctAnswer)
                              ? 600
                              : 400
                          }
                          style={{ flex: 1 }}
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
                  <Text size="sm">
                    {selectedQuestionForPreview.explanation}
                  </Text>
                </Card>
              </div>
            )}

            <Group justify="flex-end" mt="md">
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
          </Stack>
        )}
      </Modal>
    </Container>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}
