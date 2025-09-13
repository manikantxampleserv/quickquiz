import { NextRequest, NextResponse } from "next/server";
import { questionService } from "@/lib/services/database";
import { ActivityService } from "@/lib/services/activity";
import { ActivityType } from "@/lib/generated/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Question ID is required" },
        { status: 400 }
      );
    }

    const existingQuestion = await questionService.findById(id);

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    await questionService.delete(id);

    // Log the deletion activity
    await ActivityService.logActivity(
      existingQuestion.createdById,
      ActivityType.QUESTION_DELETED,
      `Deleted question: "${existingQuestion.question.substring(0, 50)}${existingQuestion.question.length > 50 ? '...' : ''}"`,
      { questionId: id, difficulty: existingQuestion.difficulty }
    );

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete question" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Question ID is required" },
        { status: 400 }
      );
    }

    const question = await questionService.findById(id);

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        question: question.question,
        options: [
          question.option1,
          question.option2,
          question.option3,
          question.option4,
        ],
        correctAnswer: question.correctAnswer - 1,
        difficulty: question.difficulty.toLowerCase(),
        explanation: question.explanation,
        createdAt: question.createdAt,
        createdBy: question.createdBy,
      },
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { question, options, correctAnswer, difficulty, explanation } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Question ID is required" },
        { status: 400 }
      );
    }

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

    const existingQuestion = await questionService.findById(id);

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    const updatedQuestion = await questionService.update(id, {
      question,
      option1: options[0],
      option2: options[1],
      option3: options[2],
      option4: options[3],
      correctAnswer: parseInt(correctAnswer) + 1,
      difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
      explanation,
    });

    // Log the update activity
    await ActivityService.logActivity(
      existingQuestion.createdById,
      ActivityType.QUESTION_UPDATED,
      `Updated question: "${question.substring(0, 50)}${question.length > 50 ? '...' : ''}"`,
      { questionId: id, difficulty: difficulty.toUpperCase() }
    );

    return NextResponse.json({
      success: true,
      question: {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        options: [
          updatedQuestion.option1,
          updatedQuestion.option2,
          updatedQuestion.option3,
          updatedQuestion.option4,
        ],
        correctAnswer: updatedQuestion.correctAnswer - 1,
        difficulty: updatedQuestion.difficulty.toLowerCase(),
        explanation: updatedQuestion.explanation,
      },
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update question" },
      { status: 500 }
    );
  }
}
