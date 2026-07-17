import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Ako Chronicles",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {children}
    </div>
  );
}
