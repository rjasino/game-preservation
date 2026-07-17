import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/db";
import { auth } from "@/lib/auth.config";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const client = await clientPromise();
    const db = client.db();

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Admin account cannot be deleted through this flow." },
        { status: 403 }
      );
    }

    await db.collection("users").deleteOne({ _id: user._id });
    await db.collection("accounts").deleteMany({ userId: user._id });
    await db.collection("sessions").deleteMany({ userId: user._id });
    await db
      .collection("verification_tokens")
      .deleteMany({ identifier: user.email });

    return NextResponse.json(
      { message: "Account deleted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}



