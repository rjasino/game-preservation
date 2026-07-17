export type UserRole = "admin" | "author";

export function isAdmin(role?: string): role is "admin" {
  return role === "admin";
}

export function isAuthor(role?: string): role is "author" {
  return role === "author";
}
