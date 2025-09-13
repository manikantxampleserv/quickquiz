import { prisma } from "../prisma";
import { Difficulty, Role } from "../generated/prisma";

// User Services
export const userService = {
  async create(data: { email: string; name: string; role?: Role }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role || "USER",
      },
    });
  },

  async findMany() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        createdQuizzes: true,
        createdQuestions: true,
        quizAttempts: true,
      },
    });
  },

  async update(
    id: string,
    data: Partial<{ email: string; name: string; role: Role }>
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};

// Question Services
export const questionService = {
  async create(data: {
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    correctAnswer: number;
    difficulty: Difficulty;
    explanation?: string;
    createdById: string;
  }) {
    return prisma.question.create({
      data,
      include: {
        createdBy: true,
      },
    });
  },

  async findMany(filters?: { difficulty?: Difficulty; isActive?: boolean }) {
    return prisma.question.findMany({
      where: {
        difficulty: filters?.difficulty,
        isActive: filters?.isActive ?? true,
      },
      include: {
        createdBy: true,
        _count: {
          select: {
            quizQuestions: true,
          },
        },
        quizQuestions: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        createdBy: true,
        quizQuestions: {
          include: {
            quiz: true,
          },
        },
      },
    });
  },

  async update(
    id: string,
    data: Partial<{
      question: string;
      option1: string;
      option2: string;
      option3: string;
      option4: string;
      correctAnswer: number;
      difficulty: Difficulty;
      explanation: string;
      isActive: boolean;
    }>
  ) {
    return prisma.question.update({
      where: { id },
      data,
      include: {
        createdBy: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.question.delete({
      where: { id },
    });
  },
};

// Quiz Services
export const quizService = {
  async create(data: {
    title: string;
    description?: string;
    timeLimit: number;
    isPublic: boolean;
    createdById: string;
    questionIds: string[];
  }) {
    const { questionIds, ...quizData } = data;

    return prisma.quiz.create({
      data: {
        ...quizData,
        quizQuestions: {
          create: questionIds.map((questionId, index) => ({
            questionId,
            order: index + 1,
            points: 1,
          })),
        },
      },
      include: {
        createdBy: true,
        quizQuestions: {
          include: {
            question: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async findMany(filters?: {
    categoryId?: string;
    isPublic?: boolean;
    isActive?: boolean;
    createdById?: string;
  }) {
    return prisma.quiz.findMany({
      where: {
        isPublic: filters?.isPublic,
        isActive: filters?.isActive ?? true,
        createdById: filters?.createdById,
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
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        createdBy: true,
        quizQuestions: {
          include: {
            question: {
              include: {},
            },
          },
          orderBy: { order: "asc" },
        },
        quizAttempts: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      timeLimit: number;
      isPublic: boolean;
      categoryId: string;
      isActive: boolean;
    }>
  ) {
    return prisma.quiz.update({
      where: { id },
      data,
      include: {
        createdBy: true,
        quizQuestions: {
          include: {
            question: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.quiz.delete({
      where: { id },
    });
  },

  async addQuestions(quizId: string, questionIds: string[]) {
    const existingCount = await prisma.quizQuestion.count({
      where: { quizId },
    });

    return prisma.quizQuestion.createMany({
      data: questionIds.map((questionId, index) => ({
        quizId,
        questionId,
        order: existingCount + index + 1,
        points: 1,
      })),
    });
  },

  async removeQuestion(quizId: string, questionId: string) {
    return prisma.quizQuestion.delete({
      where: {
        quizId_questionId: {
          quizId,
          questionId,
        },
      },
    });
  },
};

// Analytics Services
export const analyticsService = {
  async getDashboardStats() {
    const [totalUsers, totalQuizzes, totalQuestions, totalAttempts] =
      await Promise.all([
        prisma.user.count(),
        prisma.quiz.count({ where: { isActive: true } }),
        prisma.question.count({ where: { isActive: true } }),
        prisma.quizAttempt.count(),
      ]);

    const recentQuizzes = await prisma.quiz.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimit: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            quizQuestions: true,
          },
        },
      },
    });

    // Format the response to ensure proper serialization
    return {
      totalUsers,
      totalQuizzes,
      totalQuestions,
      totalAttempts,
      recentQuizzes: recentQuizzes.map((quiz) => ({
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt?.toISOString() || null,
      })),
    };
  },

  async getQuizStats(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        quizAttempts: {
          include: {
            user: true,
            answers: true,
          },
        },
        quizQuestions: true,
      },
    });

    if (!quiz) return null;

    const totalAttempts = quiz.quizAttempts.length;
    const completedAttempts = quiz.quizAttempts.filter(
      (attempt) => attempt.status === "COMPLETED"
    ).length;
    const averageScore =
      totalAttempts > 0
        ? quiz.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
          totalAttempts
        : 0;

    return {
      quiz,
      totalAttempts,
      completedAttempts,
      averageScore,
      completionRate:
        totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
    };
  },
};
