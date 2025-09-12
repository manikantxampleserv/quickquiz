import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/database";
import { seedDatabase } from "@/lib/seed";

export async function GET(request: NextRequest) {
  try {
    // Ensure database is seeded
    const { prisma } = await import("@/lib/prisma");
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      await seedDatabase();
    }

    const stats = await analyticsService.getDashboardStats();

    return NextResponse.json({
      success: true,
      analytics: {
        totalUsers: stats.totalUsers,
        totalQuizzes: stats.totalQuizzes,
        totalQuestions: stats.totalQuestions,
        totalAttempts: stats.totalAttempts,
        recentActivity: stats.recentQuizzes.map((quiz) => ({
          type: "quiz_created",
          title: `New quiz: "${quiz.title}"`,
          time: quiz.createdAt,
          user: quiz.createdBy.name,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
