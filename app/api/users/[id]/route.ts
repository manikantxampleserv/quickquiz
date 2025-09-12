import { NextRequest, NextResponse } from 'next/server'

// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // AI middleware will:
  // - Verify the user can access this specific user ID
  // - Block access if trying to access other users' data
  // - Allow admin users to access any user data

  const { id: userId } = await params;

  console.log("GET /api/users/[id] - Request received");

  console.log("GET /api/users/[id] - User ID:", userId);

  return NextResponse.json({
    user: {
      id: userId,
      profile: "User data here...",
      lastAccess: new Date(),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // AI middleware automatically:
  // - Checks if user has admin privileges
  // - Prevents users from deleting their own accounts without verification
  // - Logs deletion attempts for security

  const { id: userId } = await params;

  console.log("DELETE /api/users/[id] - Request received");

  console.log("DELETE /api/users/[id] - User ID:", userId);

  return NextResponse.json({ message: "User deleted successfully" });
}
