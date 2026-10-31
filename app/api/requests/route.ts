import { NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getRedisClient } from "@/lib/redis";

type HelpRequest = {
  id: number;
  student_name: string;
  message: string;
  created_at: Date;
};

const latestRequestsKey = "help:latest";
const cacheTtlSeconds = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      student_name?: unknown;
      message?: unknown;
    };

    const studentName =
      typeof body.student_name === "string" ? body.student_name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!studentName || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "student_name and message are required",
        },
        { status: 400 },
      );
    }

    const result = await pool.query<{ id: number }>(
      "INSERT INTO help_requests (student_name, message) VALUES ($1, $2) RETURNING id",
      [studentName, message],
    );

    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(latestRequestsKey);
      }
    } catch (error) {
      console.error("Redis cache invalidation failed:", error);
    }

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Failed to create help request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to create help request",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const redis = await getRedisClient();

    if (redis) {
      try {
        const cached = await redis.get(latestRequestsKey);
        if (cached) {
          return NextResponse.json({
            requests: JSON.parse(cached) as HelpRequest[],
            source: "Redis",
          });
        }
      } catch (error) {
        console.error("Redis cache read failed:", error);
      }
    }

    const result = await pool.query<HelpRequest>(
      "SELECT id, student_name, message, created_at FROM help_requests ORDER BY created_at DESC, id DESC LIMIT 10",
    );

    try {
      if (redis) {
        await redis.setEx(
          latestRequestsKey,
          cacheTtlSeconds,
          JSON.stringify(result.rows),
        );
      }
    } catch (error) {
      console.error("Redis cache write failed:", error);
    }

    return NextResponse.json({
      requests: result.rows,
      source: "PostgreSQL",
    });
  } catch (error) {
    console.error("Failed to fetch help requests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch help requests",
      },
      { status: 500 },
    );
  }
}
