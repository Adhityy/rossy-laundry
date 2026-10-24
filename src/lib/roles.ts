export type UserRole = "CUSTOMER" | "ADMIN" | "OWNER";

export function isStaffRole(role: unknown): role is "ADMIN" | "OWNER" {
  return role === "ADMIN" || role === "OWNER";
}

export function isOwnerRole(role: unknown): role is "OWNER" {
  return role === "OWNER";
}
