import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import { clientPromise } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";
import { randomBytes } from "node:crypto";

export async function POST(request: Request) {
  // Rate limiting
  if (checkRateLimit(request)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { email, name, password } = parsed.data;

    const client = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    // Check for existing user
    const existing = await usersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const now = new Date();
    const result = await usersCollection.insertOne({
      email,
      name,
      hashedPassword,
      role: "author",
      emailVerified: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    });

    // Generate verification token
    const token = randomBytes(32).toString("hex");
    const verificationTokens = db.collection("verification_tokens");
    await verificationTokens.insertOne({
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // In production, send email with the token here.
    // For development, log the verification URL.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[DEV] Verification link: ${process.env.AUTH_URL}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}`
      );
    }

    return NextResponse.json(
      {
        message:
          "Account created. Please check your email to verify your account.",
        userId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

