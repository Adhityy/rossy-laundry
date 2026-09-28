import { ORDER_STATUSES } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export function statusLabel(key: string): string {
  return ORDER_STATUSES.find((s) => s.key === key)?.label ?? key;
}

export function statusStep(key: string): number {
  return ORDER_STATUSES.find((s) => s.key === key)?.step ?? 1;
}

/** One accent for every status; the label carries the meaning, not a colour. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className="border-primary/30 bg-primary/10 font-medium text-primary hover:bg-primary/10"
    >
      {statusLabel(status)}
    </Badge>
  );
}
