import { auth } from "@/lib/auth";
import { isOwnerRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (!isOwnerRole(role)) redirect("/admin");

  return children;
}
