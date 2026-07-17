import { NextResponse } from "next/server";
import { profileUpdateSchema } from "@/lib/validations";
import { clientPromise } from "@/lib/db";
import { auth } from "@/lib/auth.config";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid name" }, { status: 422 });
    }

    const client = await clientPromise();
    const db = client.db();

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(session.user.id) },
      { $set: { name: parsed.data.name, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: result._id.toString(),
      name: result.name,
      email: result.email,
      role: result.role,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

