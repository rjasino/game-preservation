import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  // Read env var lazily inside the function — avoids crashing at module
  // import time when process.env may not be populated (e.g. during build).
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Auth.js MongoDB adapter accepts a factory function (() => Promise<MongoClient>).
// Wrapping in a function defers the connection until the adapter first needs it,
// preventing crashes during Next.js build when env vars aren't populated.
const clientPromise = () => connectDB().then((m) => m.connection.getClient());

export default connectDB;
export { clientPromise };
