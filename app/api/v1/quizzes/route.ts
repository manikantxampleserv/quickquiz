import { seedDatabase } from "@/lib/seed";
import { NextRequest, NextResponse } from "next/server";
import { ActivityService } from "@/lib/services/activity";
import { ActivityType } from "@/lib/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const isPublic = searchParams.get("isPublic");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeCount = searchParams.get("includeCount") === "true";

    const { prisma } = await import("@/lib/prisma");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count if requested
    let total = 0;
    if (includeCount) {
      total = await prisma.quiz.count({
        where: {
          isPublic: isPublic ? isPublic === "true" : undefined,
        },
      });
    }

    const quizzes = await prisma.quiz.findMany({
      skip,
      take: limit,
      where: {
        isPublic: isPublic ? isPublic === "true" : undefined,
      },
      include: {
        createdBy: true,
        _count: {
          select: {
            quizQuestions: true,
            quizAttempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        isPublic: quiz.isPublic,
        _count: {
          questions: quiz._count.quizQuestions,
        },
        questionCount: quiz._count.quizQuestions,
        attemptCount: quiz._count.quizAttempts,
        createdAt: quiz.createdAt,
        createdBy: quiz.createdBy.name,
      })),
      total: includeCount ? total : undefined,
      page,
      limit,
      totalPages: includeCount ? Math.ceil(total / limit) : undefined,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, timeLimit, isPublic } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Get or create admin user
    const { prisma } = await import("@/lib/prisma");
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      await seedDatabase();
      adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
    }

    // Create quiz as a category without questions initially
    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        description: description || "",
        timeLimit: timeLimit || 30,
        isPublic: isPublic !== false,
        createdById: adminUser!.id,
      },
      include: {
        quizQuestions: {
          include: {
            question: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        createdBy: true,
        _count: {
          select: {
            quizQuestions: true,
            quizAttempts: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      quiz: {
        id: newQuiz.id,
        title: newQuiz.title,
        description: newQuiz.description,
        timeLimit: newQuiz.timeLimit,
        isPublic: newQuiz.isPublic,
        questionCount: newQuiz._count.quizQuestions,
        attemptCount: newQuiz._count.quizAttempts,
        createdAt: newQuiz.createdAt,
        createdBy: newQuiz.createdBy.name,
        questions: newQuiz.quizQuestions.map((qq) => ({
          id: qq.question.id,
          question: qq.question.question,
          options: [
            qq.question.option1,
            qq.question.option2,
            qq.question.option3,
            qq.question.option4,
          ],
          correctAnswer: qq.question.correctAnswer - 1,
          difficulty: qq.question.difficulty.toLowerCase(),
          order: qq.order,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
