import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations";
import { clientPromise } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { token, password } = parsed.data;

    const client = await clientPromise();
    const db = client.db();

    // Find and validate token
    const tokenDoc = await db
      .collection("verification_tokens")
      .findOne({ token });

    if (!tokenDoc || tokenDoc.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 401 }
      );
    }

    // Find user
    const user = await db
      .collection("users")
      .findOne({ email: tokenDoc.identifier });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { hashedPassword, updatedAt: new Date() } }
    );

    // Delete used token and all sessions for this user
    await db.collection("verification_tokens").deleteOne({ _id: tokenDoc._id });
    await db.collection("sessions").deleteMany({ userId: user._id });

    return NextResponse.json(
      { message: "Password updated. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

