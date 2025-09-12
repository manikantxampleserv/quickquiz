import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const { id: quizId } = await params
    
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId
      },
      include: {
        category: true,
        createdBy: true,
        _count: {
          select: {
            quizQuestions: true,
            quizAttempts: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        isPublic: quiz.isPublic,
        category: quiz.category?.name,
        _count: {
          questions: quiz._count.quizQuestions
        },
        questionCount: quiz._count.quizQuestions,
        attemptCount: quiz._count.quizAttempts,
        createdAt: quiz.createdAt,
        createdBy: quiz.createdBy.name,
      },
    })
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { title, description, timeLimit, isPublic } = body
    
    const { id: quizId } = await params

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description: description || '',
        timeLimit: timeLimit || 30,
        isPublic: isPublic !== false,
      },
      include: {
        category: true,
        createdBy: true,
        _count: {
          select: {
            quizQuestions: true,
            quizAttempts: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      quiz: {
        id: updatedQuiz.id,
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        timeLimit: updatedQuiz.timeLimit,
        isPublic: updatedQuiz.isPublic,
        category: updatedQuiz.category?.name,
        questionCount: updatedQuiz._count.quizQuestions,
        attemptCount: updatedQuiz._count.quizAttempts,
        createdAt: updatedQuiz.createdAt,
        createdBy: updatedQuiz.createdBy.name,
      },
    })
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const { id: quizId } = await params

    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}
