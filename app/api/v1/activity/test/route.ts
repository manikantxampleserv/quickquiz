import { NextResponse } from "next/server";
import { ActivityService } from "@/lib/services/activity";
import { ActivityType } from "@/lib/generated/prisma";

export async function POST(request: Request) {
  try {
    console.log('Received request to log test activity');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { userId, type, title, metadata } = body;
    
    console.log('Calling ActivityService.logActivity with:', {
      userId,
      type,
      title,
      metadata
    });
    
    await ActivityService.logActivity(
      userId,
      type as ActivityType,
      title,
      metadata
    );
    
    console.log('Successfully logged activity');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging test activity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log test activity" },
      { status: 500 }
    );
  }
}
