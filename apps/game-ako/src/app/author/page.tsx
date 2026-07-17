import { auth, signOut } from "@/lib/auth.config";
import { redirect } from "next/navigation";

export default async function AuthorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Author Dashboard
          </h1>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            My Retrospectives
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your retrospectives will appear here. Create your first one to get
            started.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Welcome, {session.user?.name || session.user?.email}.
          </p>
        </div>
      </main>
    </div>
  );
}
