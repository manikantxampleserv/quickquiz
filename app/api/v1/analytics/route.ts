import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/database";
import { seedDatabase } from "@/lib/seed";

interface ActivityCount {
  date: string;
  count: bigint;
}

interface DailyActivity {
  quizzes: number;
  questions: number;
  attempts: number;
}

export async function GET(request: NextRequest) {
  const { prisma } = await import("@/lib/prisma");

  try {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        await seedDatabase();
      }
    } catch (seedError) {
      console.error("Error during database seeding check:", seedError);
    }

    let stats;
    try {
      stats = await analyticsService.getDashboardStats();
    } catch (statsError) {
      console.error("Error fetching dashboard stats:", statsError);
      throw new Error(
        `Failed to fetch dashboard stats: ${
          statsError instanceof Error ? statsError.message : "Unknown error"
        }`
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let quizCreations: ActivityCount[] = [];
    let questionCreations: ActivityCount[] = [];
    let attempts: ActivityCount[] = [];

    try {
      [quizCreations, questionCreations, attempts] = await Promise.all([
        prisma.$queryRaw<ActivityCount[]>`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM Quiz
          WHERE createdAt >= ${sevenDaysAgo}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `,
        prisma.$queryRaw<ActivityCount[]>`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM Question
          WHERE createdAt >= ${sevenDaysAgo}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `,
        prisma.$queryRaw<ActivityCount[]>`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM QuizAttempt
          WHERE createdAt >= ${sevenDaysAgo}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `,
      ]);
    } catch (queryError) {
      console.error("Error fetching activity data:", queryError);
      quizCreations = [];
      questionCreations = [];
      attempts = [];
    }

    const activityByDay: Record<string, DailyActivity> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activityByDay[dateStr] = { quizzes: 0, questions: 0, attempts: 0 };
    }

    quizCreations.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      activityByDay[dateStr].quizzes = Number(item.count);
    });

    questionCreations.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      activityByDay[dateStr].questions = Number(item.count);
    });

    attempts.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      activityByDay[dateStr].attempts = Number(item.count);
    });

    // Format the response
    const formattedActivity = Object.entries(activityByDay)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateA).getTime() - new Date(dateB).getTime()
      )
      .map(([date, data]) => ({
        date,
        ...data,
      }));

    let recentActivities: Array<{
      id: string;
      type: string;
      title: string;
      createdAt: Date;
      userId: string;
      metadata: string | null;
      user: {
        id: string;
        name: string | null;
        email: string | null;
      } | null;
    }> = [];

    try {
      recentActivities = await prisma.activityLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      recentActivities = [];
    }

    let questionDifficulties: { difficulty: string; count: bigint }[] = [];
    try {
      questionDifficulties = await prisma.$queryRaw<
        { difficulty: string; count: bigint }[]
      >`
        SELECT difficulty, COUNT(*) as count
        FROM Question
        GROUP BY difficulty
        ORDER BY difficulty ASC
      `;
    } catch (error) {
      console.error("Error fetching question difficulties:", error);
      questionDifficulties = [];
    }

    let avgScore = 0;
    let completionRate = 0;
    try {
      const avgScoreResult = await prisma.$queryRaw<{ avgScore: number }[]>`
        SELECT AVG(CAST(score AS FLOAT) / CAST(totalPoints AS FLOAT) * 100) as avgScore
        FROM QuizAttempt
        WHERE totalPoints > 0
      `;
      avgScore = avgScoreResult[0]?.avgScore || 0;

      const completionResult = await prisma.$queryRaw<
        { completed: bigint; total: bigint }[]
      >`
        SELECT 
          COUNT(CASE WHEN completed = 1 THEN 1 END) as completed,
          COUNT(*) as total
        FROM QuizAttempt
      `;
      const completion = completionResult[0];
      completionRate = completion?.total
        ? (Number(completion.completed) / Number(completion.total)) * 100
        : 0;
    } catch (error) {
      console.error("Error calculating performance metrics:", error);
    }

    try {
      const responseData = {
        success: true,
        data: {
          ...stats,
          activity: formattedActivity,
          questionDifficulties: questionDifficulties.map((item) => ({
            difficulty: item.difficulty,
            count: Number(item.count),
          })),
          performanceMetrics: {
            avgScore: Math.round(avgScore),
            completionRate: Math.round(completionRate),
            userRetention:
              stats.totalUsers > 0
                ? Math.round((stats.totalAttempts / stats.totalUsers) * 100)
                : 0,
            platformActivity:
              stats.totalQuestions > 0
                ? Math.round((stats.totalAttempts / stats.totalQuestions) * 100)
                : 0,
          },
          recentActivities: recentActivities.map((activity) => {
            return {
              id: activity.id,
              type: activity.type,
              title: activity.title,
              time: activity.createdAt.toISOString(),
              user: {
                id: activity.userId,
                name: activity.user?.name || "System",
                email: activity.user?.email || "",
              },
              metadata: (() => {
                try {
                  if (!activity.metadata) return null;
                  return typeof activity.metadata === "string"
                    ? JSON.parse(activity.metadata)
                    : activity.metadata;
                } catch (e) {
                  console.error("Error parsing metadata:", e);
                  return null;
                }
              })(),
            };
          }),
        },
      };

      return NextResponse.json(responseData);
    } catch (error) {
      console.error("Error formatting response:", error);
      throw error;
    }
  } catch (error) {
    console.error("Analytics error:", error);

    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: (error as any).cause,
      });
    } else {
      console.error("Non-Error object thrown:", error);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
