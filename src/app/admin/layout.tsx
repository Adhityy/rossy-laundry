import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (!isStaffRole(role)) redirect("/");

  return children;
}
