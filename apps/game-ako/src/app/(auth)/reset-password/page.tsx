import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your new password below.
          </p>
        </div>

        <form
          action="/api/auth/reset-password"
          method="POST"
          className="space-y-4"
        >
          <input type="hidden" name="token" id="reset-token" />

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Min. 8 chars, 1 letter + 1 number"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Update Password
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Back to sign in
          </Link>
        </p>

        {/* Extract token from URL on client side */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const params = new URLSearchParams(window.location.search);
              const token = params.get('token');
              if (token) {
                document.getElementById('reset-token').value = token;
              }
            `,
          }}
        />
      </div>
    </div>
  );
}
