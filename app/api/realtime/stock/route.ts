// app/api/realtime/stock/route.ts
export async function GET(request: Request) {
  // AI middleware applies intelligent rate limiting:
  // - Higher limits during market hours
  // - Premium users get real-time data
  // - Free users get delayed data
  // - Blocks excessive requests from trading bots

  return Response.json({
    symbol: "AAPL",
    price: 175.32,
    change: +2.45,
    timestamp: new Date(),
    realTime: true, // AI determines based on user tier
  });
}
