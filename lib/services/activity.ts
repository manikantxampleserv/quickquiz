import { prisma } from "@/lib/prisma";
import { ActivityType } from "@/lib/generated/prisma";

export class ActivityService {
  static async logActivity(
    userId: string,
    type: ActivityType,
    title: string,
    metadata?: any
  ) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          type,
          title,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  static async getRecentActivities(limit: number = 10) {
    return await prisma.activityLog.findMany({
      take: limit,
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
  }

  static async getActivitiesByType(type: ActivityType, limit: number = 10) {
    return await prisma.activityLog.findMany({
      where: { type },
      take: limit,
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
  }

  static async getActivitiesByUser(userId: string, limit: number = 10) {
    return await prisma.activityLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}
