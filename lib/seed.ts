import { prisma } from "./prisma";

export async function seedDatabase() {
  try {
    // Create default admin user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@quickquiz.com" },
      update: {},
      create: {
        email: "admin@quickquiz.com",
        name: "Admin User",
        role: "ADMIN",
      },
    });

    // Create sample quizzes
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
    }

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
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      const existing = await prisma.question.findFirst({
        where: {
          question: questionData.question,
        },
      });

      if (!existing) {
        const newQuestion = await prisma.question.create({
          data: questionData,
        });

        // Link questions to appropriate quizzes based on question content
        let targetQuiz;
        if (
          questionData.question.includes("√") ||
          questionData.question.includes("HCF") ||
          questionData.question.includes("%")
        ) {
          targetQuiz = aptitudeQuiz;
        } else if (
          questionData.question.includes("JavaScript") ||
          questionData.question.includes("var") ||
          questionData.question.includes("typeof")
        ) {
          targetQuiz = jsQuiz;
        } else if (
          questionData.question.includes("React") ||
          questionData.question.includes("JSX") ||
          questionData.question.includes("useState")
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
              questionId: newQuestion.id,
            },
          });

          if (!existingLink) {
            await prisma.quizQuestion.create({
              data: {
                quizId: targetQuiz.id,
                questionId: newQuestion.id,
                order: i + 1,
              },
            });
          }
        }
      }
    }

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
