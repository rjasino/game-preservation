import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import mongoose from "mongoose";
import { clientPromise } from "./db";

const { ObjectId } = mongoose.Types;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const authConfig: NextAuthConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: MongoDBAdapter(clientPromise as any),
  session: {
    strategy: "database",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const client = await clientPromise();
        const db = client.db();
        const user = await db
          .collection("users")
          .findOne({ email: email.toLowerCase() });

        if (!user) return null;
        if (!user.emailVerified) throw new Error("EmailNotVerified");
        if (!user.hashedPassword) return null;

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || "author",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "author";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const client = await clientPromise();
        const db = client.db();
        const dbUser = await db.collection("users").findOne({
          _id: new ObjectId(user.id),
        });
        (session.user as { role?: string }).role =
          dbUser?.role || "author";
      }
      return session;
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);



