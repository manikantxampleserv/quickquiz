import { NextRequest, NextResponse } from "next/server";
import { questionService } from "@/lib/services/database";
import { seedDatabase } from "@/lib/seed";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { questions, quizId } = await request.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Questions array is required" },
        { status: 400 }
      );
    }

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      await seedDatabase();
      adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
    }

    // Create all questions
    const createdQuestions = [];
    for (const questionData of questions) {
      try {
        const newQuestion = await questionService.create({
          question: questionData.question,
          option1: questionData.options[0],
          option2: questionData.options[1],
          option3: questionData.options[2],
          option4: questionData.options[3],
          correctAnswer: parseInt(questionData.correctAnswer) + 1,
          difficulty: questionData.difficulty?.toUpperCase() || "MEDIUM",
          explanation: questionData.explanation,
          createdById: adminUser!.id,
        });

        // Link question to quiz if quizId is provided
        if (quizId) {
          const existingQuizQuestion = await prisma.quizQuestion.findFirst({
            where: {
              quizId: quizId,
              questionId: newQuestion.id,
            },
          });

          if (!existingQuizQuestion) {
            // Get the current max order for this quiz
            const maxOrder = await prisma.quizQuestion.findFirst({
              where: { quizId: quizId },
              orderBy: { order: 'desc' },
              select: { order: true },
            });

            await prisma.quizQuestion.create({
              data: {
                quizId: quizId,
                questionId: newQuestion.id,
                order: (maxOrder?.order || 0) + 1,
                points: 1,
              },
            });
          }
        }

        createdQuestions.push({
          id: newQuestion.id,
          question: newQuestion.question,
          options: [
            newQuestion.option1,
            newQuestion.option2,
            newQuestion.option3,
            newQuestion.option4,
          ],
          correctAnswer: newQuestion.correctAnswer - 1,
          difficulty: newQuestion.difficulty.toLowerCase(),
          explanation: newQuestion.explanation,
        });
      } catch (error) {
        console.error("Error creating question:", questionData.question, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdQuestions.length} questions`,
      questions: createdQuestions,
    });
  } catch (error) {
    console.error("Error bulk creating questions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create questions" },
      { status: 500 }
    );
  }
}
