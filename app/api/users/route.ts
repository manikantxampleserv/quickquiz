// app/api/users/route.ts
export async function GET(request: Request) {
  // AI middleware automatically handles:
  // - Authentication verification
  // - Rate limiting based on user tier
  // - Error handling for invalid requests

  console.log("GET /api/users - Request received");

  return Response.json({
    users: [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ],
  });
}

export async function POST(request: Request) {
  // AI middleware will:
  // - Validate authentication token
  // - Check if user has permission to create users
  // - Rate limit based on request patterns

  console.log("POST /api/users - Request received");

  const body = await request.json();

  console.log("POST /api/users - Body parsed:", body);

  return Response.json({
    message: "User created successfully",
    user: { id: 3, ...body },
  });
}
