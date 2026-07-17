import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/validations";
import { clientPromise } from "@/lib/db";
import { randomBytes } from "node:crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body.email);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "If that email is registered, a reset link has been sent." },
        { status: 200 }
      );
    }

    const email = parsed.data;
    const client = await clientPromise();
    const db = client.db();

    // Check if user exists and has a password
    const user = await db.collection("users").findOne({ email });
    if (!user || !user.hashedPassword) {
      // Always return the same message to prevent email enumeration
      return NextResponse.json(
        { message: "If that email is registered, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    await db.collection("verification_tokens").insertOne({
      identifier: email,
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // In production, send email with reset link
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[DEV] Reset link: ${process.env.AUTH_URL}/reset-password?token=${token}`
      );
    }

    return NextResponse.json(
      { message: "If that email is registered, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

