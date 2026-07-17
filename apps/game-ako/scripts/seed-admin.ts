import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env.local before anything else — tsx doesn't auto-load it like Next.js does
config({ path: resolve(__dirname, "..", ".env.local") });

import bcrypt from "bcryptjs";
import { clientPromise } from "../src/lib/db";

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      "[seed-admin] ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seed."
    );
    console.warn(
      "[seed-admin] Make sure .env.local exists in apps/game-ako/ with ADMIN_EMAIL and ADMIN_PASSWORD."
    );
    return;
  }

  const client = await clientPromise();
  const db = client.db();
  const usersCollection = db.collection("users");

  const existing = await usersCollection.findOne({
    email: adminEmail.toLowerCase(),
  });

  if (existing) {
    console.log(`[seed-admin] Admin account already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const now = new Date();

  await usersCollection.insertOne({
    email: adminEmail.toLowerCase(),
    name: "Admin",
    hashedPassword,
    role: "admin",
    emailVerified: now,
    image: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`[seed-admin] Admin account created: ${adminEmail}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-admin] Error:", err);
    process.exit(1);
  });
