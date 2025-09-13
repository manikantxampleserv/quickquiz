import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma");

    const { id: quizId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.quizQuestion.count({
      where: { quizId },
    });

    const questions = await prisma.quizQuestion.findMany({
      skip,
      take: limit,
      where: {
        quizId: quizId,
      },
      include: {
        question: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      questions: questions.map((qq) => ({
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
        explanation: qq.question.explanation,
        order: qq.order,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz questions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const body = await request.json();
    const { question, options, correctAnswer, difficulty, explanation } = body;

    const { id: quizId } = await params;

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

    // Get or create admin user
    const { seedDatabase } = await import("@/lib/seed");
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      await seedDatabase();
      adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
    }

    // Get the next order number for this quiz
    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { quizId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastQuestion?.order || 0) + 1;

    // Create the question first
    const newQuestion = await prisma.question.create({
      data: {
        question,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        correctAnswer: correctAnswer + 1, // Convert from 0-based to 1-based
        difficulty: difficulty.toUpperCase(),
        explanation: explanation || "",
        createdById: adminUser!.id,
      },
    });

    // Link the question to the quiz
    await prisma.quizQuestion.create({
      data: {
        quizId,
        questionId: newQuestion.id,
        order: nextOrder,
        points: 1,
      },
    });

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
        order: nextOrder,
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
