import { prisma } from "./prisma";
import { ActivityService } from "./services/activity";
import { ActivityType } from "./generated/prisma";

export async function seedDatabase() {
  try {
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@quickquiz.com" },
      update: {},
      create: {
        email: "admin@quickquiz.com",
        name: "Admin User",
        role: "ADMIN",
      },
    });

    await ActivityService.logActivity(
      adminUser.id,
      ActivityType.USER_REGISTERED,
      `Admin user created: ${adminUser.email}`,
      { role: adminUser.role }
    );

    const testUser = await prisma.user.upsert({
      where: { email: "test@quickquiz.com" },
      update: {},
      create: {
        email: "test@quickquiz.com",
        name: "Test User",
        role: "USER",
      },
    });

    await ActivityService.logActivity(
      testUser.id,
      ActivityType.USER_REGISTERED,
      `Test user registered: ${testUser.email}`,
      { role: testUser.role }
    );

    let aptitudeQuiz = await prisma.quiz.findFirst({
      where: { title: "Aptitude and Reasoning" },
    });
    if (!aptitudeQuiz) {
      aptitudeQuiz = await prisma.quiz.create({
        data: {
          title: "Aptitude and Reasoning",
          description:
            "This category contains questions related to aptitude and reasoning skills.",
          timeLimit: 30,
          isPublic: true,
          createdById: adminUser.id,
        },
      });

      await ActivityService.logActivity(
        adminUser.id,
        ActivityType.QUIZ_CREATED,
        `Created quiz: ${aptitudeQuiz.title}`,
        { quizId: aptitudeQuiz.id }
      );
    }

    let jsQuiz = await prisma.quiz.findFirst({
      where: { title: "JavaScript Fundamentals" },
    });
    if (!jsQuiz) {
      jsQuiz = await prisma.quiz.create({
        data: {
          title: "JavaScript Fundamentals",
          description: "Basic JavaScript programming concepts and syntax.",
          timeLimit: 25,
          isPublic: true,
          createdById: adminUser.id,
        },
      });

      await ActivityService.logActivity(
        adminUser.id,
        ActivityType.QUIZ_CREATED,
        `Created quiz: ${jsQuiz.title}`,
        { quizId: jsQuiz.id }
      );
    }

    let reactQuiz = await prisma.quiz.findFirst({
      where: { title: "React Basics" },
    });
    if (!reactQuiz) {
      reactQuiz = await prisma.quiz.create({
        data: {
          title: "React Basics",
          description: "Fundamental React concepts and hooks.",
          timeLimit: 20,
          isPublic: true,
          createdById: adminUser.id,
        },
      });

      await ActivityService.logActivity(
        adminUser.id,
        ActivityType.QUIZ_CREATED,
        `Created quiz: ${reactQuiz.title}`,
        { quizId: reactQuiz.id }
      );
    }

    // Helper function to create a question and log the activity
    const createQuestion = async (questionData: any) => {
      const question = await prisma.question.create({
        data: questionData,
      });

      await ActivityService.logActivity(
        questionData.createdById,
        ActivityType.QUESTION_CREATED,
        `Created question: ${question.question.substring(0, 50)}${
          question.question.length > 50 ? "..." : ""
        }`,
        {
          questionId: question.id,
          difficulty: questionData.difficulty,
          quizId: questionData.quizId,
        }
      );

      return question;
    };

    // Create sample questions
    const questions = [
      // Aptitude and Reasoning Questions
      {
        question: "What is the value of √(144) + ∛(125)?",
        option1: "17",
        option2: "19",
        option3: "21",
        option4: "23",
        correctAnswer: 1,
        difficulty: "MEDIUM" as const,
        explanation: "√144 = 12 and ∛125 = 5, so 12 + 5 = 17",
        createdById: adminUser.id,
      },
      {
        question: "If 3x + 7 = 22, then x = ?",
        option1: "3",
        option2: "5",
        option3: "7",
        option4: "9",
        correctAnswer: 2,
        difficulty: "EASY" as const,
        explanation: "3x = 22 - 7 = 15, so x = 15/3 = 5",
        createdById: adminUser.id,
      },
      {
        question: "The HCF of 48 and 72 is:",
        option1: "12",
        option2: "18",
        option3: "24",
        option4: "36",
        correctAnswer: 3,
        difficulty: "MEDIUM" as const,
        explanation: "The highest common factor of 48 and 72 is 24",
        createdById: adminUser.id,
      },
      {
        question: "What is 25% of 80?",
        option1: "15",
        option2: "20",
        option3: "25",
        option4: "30",
        correctAnswer: 2,
        difficulty: "EASY" as const,
        explanation: "25% of 80 = (25/100) × 80 = 20",
        createdById: adminUser.id,
      },
      // JavaScript Questions
      {
        question:
          "What is the correct way to declare a variable in JavaScript?",
        option1: "var myVar = 5;",
        option2: "variable myVar = 5;",
        option3: "v myVar = 5;",
        option4: "declare myVar = 5;",
        correctAnswer: 1,
        difficulty: "EASY" as const,
        explanation:
          'The "var" keyword is used to declare variables in JavaScript.',
        createdById: adminUser.id,
      },
      {
        question: "What will be the output of: console.log(typeof null)?",
        option1: "null",
        option2: "undefined",
        option3: "object",
        option4: "boolean",
        correctAnswer: 3,
        difficulty: "MEDIUM" as const,
        explanation:
          'In JavaScript, typeof null returns "object" due to a historical bug in the language.',
        createdById: adminUser.id,
      },
      // React Questions
      {
        question: "What is JSX in React?",
        option1: "A JavaScript library",
        option2: "A syntax extension for JavaScript",
        option3: "A CSS framework",
        option4: "A database",
        correctAnswer: 2,
        difficulty: "EASY" as const,
        explanation:
          "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React components.",
        createdById: adminUser.id,
      },
      {
        question:
          "Which hook is used to manage state in functional components?",
        option1: "useEffect",
        option2: "useState",
        option3: "useContext",
        option4: "useReducer",
        correctAnswer: 2,
        difficulty: "MEDIUM" as const,
        explanation:
          "useState is the primary hook for managing local state in React functional components.",
        createdById: adminUser.id,
      },
      // CSS Questions
      {
        question: "Which CSS property is used to change the text color?",
        option1: "color",
        option2: "text-color",
        option3: "font-color",
        option4: "text-style",
        correctAnswer: 1,
        difficulty: "EASY" as const,
        explanation:
          'The "color" property is used to set the color of text in CSS.',
        createdById: adminUser.id,
      },
    ];

    // Create questions and link them to quizzes
    const createdQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      const existing = await prisma.question.findFirst({
        where: {
          question: questionData.question,
        },
      });

      if (!existing) {
        const newQuestion = await createQuestion(questionData);
        createdQuestions.push(newQuestion);
      }
    }

    // Create quiz-question relationships and log activities
    for (const question of createdQuestions) {
      // Link questions to appropriate quizzes based on question content
      let targetQuiz;
      if (
        question.question.includes("√") ||
        question.question.includes("HCF") ||
        question.question.includes("%")
      ) {
        targetQuiz = aptitudeQuiz;
      } else if (
        question.question.includes("JavaScript") ||
        question.question.includes("var") ||
        question.question.includes("typeof")
      ) {
        targetQuiz = jsQuiz;
      } else if (
        question.question.includes("React") ||
        question.question.includes("JSX") ||
        question.question.includes("useState")
      ) {
        targetQuiz = reactQuiz;
      } else {
        targetQuiz = aptitudeQuiz; // Default to aptitude quiz
      }

      if (targetQuiz) {
        // Check if quiz-question link already exists
        const existingLink = await prisma.quizQuestion.findFirst({
          where: {
            quizId: targetQuiz.id,
            questionId: question.id,
          },
        });

        if (!existingLink) {
          await prisma.quizQuestion.create({
            data: {
              quizId: targetQuiz.id,
              questionId: question.id,
              order: createdQuestions.indexOf(question) + 1,
              points: 1,
            },
          });
        }
      }
    }

    // Create a quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: testUser.id,
        quizId: aptitudeQuiz.id,
        score: 2,
        totalPoints: 3,
        timeSpent: 1200, // 20 minutes in seconds
        status: "COMPLETED",
      },
    });

    await ActivityService.logActivity(
      testUser.id,
      ActivityType.QUIZ_ATTEMPTED,
      `Completed quiz: ${aptitudeQuiz.title}`,
      {
        quizId: aptitudeQuiz.id,
        score: 2,
        totalPoints: 3,
        percentage: Math.round((2 / 3) * 100),
      }
    );

    console.log("Database seeded successfully!");
    return { success: true, message: "Database seeded successfully!" };
  } catch (error) {
    console.error("Error seeding database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
