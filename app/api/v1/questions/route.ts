import { NextRequest, NextResponse } from "next/server";
import { questionService } from "@/lib/services/database";
import { seedDatabase } from "@/lib/seed";
import { ActivityService } from "@/lib/services/activity";
import { ActivityType } from "@/lib/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty") as
      | "EASY"
      | "MEDIUM"
      | "HARD"
      | null;

    const questions = await questionService.findMany({
      difficulty: difficulty || undefined,
    });

    return NextResponse.json({
      success: true,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [q.option1, q.option2, q.option3, q.option4],
        correctAnswer: q.correctAnswer - 1, // Convert to 0-based index for frontend
        difficulty: q.difficulty.toLowerCase(),
        explanation: q.explanation,
        createdAt: q.createdAt,
        quizCount: q._count?.quizQuestions || 0, // Number of quizzes using this question
        quizzes:
          q.quizQuestions?.map((qq) => ({
            id: qq.quiz.id,
            title: qq.quiz.title,
          })) || [],
        createdBy: {
          id: q.createdBy.id,
          name: q.createdBy.name,
          email: q.createdBy.email,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      options,
      correctAnswer,
      difficulty,
      explanation,
      quizId,
    } = body;

    if (
      !question ||
      !options ||
      options.length !== 4 ||
      correctAnswer === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid question data" },
        { status: 400 }
      );
    }

    // Create default admin user if not exists
    const { prisma } = await import("@/lib/prisma");
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      // Seed database if no admin exists
      await seedDatabase();
      adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
    }

    const newQuestion = await questionService.create({
      question,
      option1: options[0],
      option2: options[1],
      option3: options[2],
      option4: options[3],
      correctAnswer: parseInt(correctAnswer) + 1, // Convert to 1-based index for database
      difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
      explanation,
      createdById: adminUser!.id,
    });

    await ActivityService.logActivity(
      adminUser!.id,
      ActivityType.QUESTION_CREATED,
      `Created new question: "${question.substring(0, 50)}${
        question.length > 50 ? "..." : ""
      }"`,
      {
        questionId: newQuestion.id,
        difficulty: difficulty.toUpperCase(),
        quizId,
      }
    );

    if (quizId) {
      const existingQuestions = await prisma.quizQuestion.findMany({
        where: { quizId },
        orderBy: { order: "desc" },
        take: 1,
      });

      const nextOrder =
        existingQuestions.length > 0 ? existingQuestions[0].order + 1 : 1;

      await prisma.quizQuestion.create({
        data: {
          quizId,
          questionId: newQuestion.id,
          order: nextOrder,
          points: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      question: {
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
        quizId: quizId || null,
      },
    });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create question" },
      { status: 500 }
    );
  }
}
