import { NextResponse } from "next/server";

import { getRedisClient } from "@/lib/redis";

export async function GET() {
  try {
    const redis = await getRedisClient();

    if (!redis) {
      return NextResponse.json(
        {
          success: false,
          error: "View counter is unavailable",
        },
        { status: 503 },
      );
    }

    const views = await redis.incr("help:views");

    return NextResponse.json({
      success: true,
      views,
    });
  } catch (error) {
    console.error("Failed to increment view counter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to update view counter",
      },
      { status: 500 },
    );
  }
}
