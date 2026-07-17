import { auth } from "./auth.config";
import { isAdmin, isAuthor, type UserRole } from "./role-check";

export { isAdmin, isAuthor };
export type { UserRole };

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  return role === "admin" || role === "author" ? role : null;
}

export async function requireRole(requiredRole: UserRole): Promise<void> {
  const role = await getCurrentUserRole();
  if (role !== requiredRole) {
    throw new Error(
      `Access denied. Required role: ${requiredRole}, current role: ${role ?? "none"}`
    );
  }
}

export async function requireAuth(): Promise<UserRole> {
  const role = await getCurrentUserRole();
  if (!role) {
    throw new Error("Authentication required");
  }
  return role;
}
