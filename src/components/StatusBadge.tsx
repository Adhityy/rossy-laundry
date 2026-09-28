import { ORDER_STATUSES, STATUS_CANCELLED } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export function statusLabel(key: string): string {
  if (key === STATUS_CANCELLED) return "Dibatalkan";
  return ORDER_STATUSES.find((s) => s.key === key)?.label ?? key;
}

export function statusStep(key: string): number {
  return ORDER_STATUSES.find((s) => s.key === key)?.step ?? 1;
}

export function StatusBadge({ status }: { status: string }) {
  const cancelled = status === STATUS_CANCELLED;
  return (
    <Badge
      variant="outline"
      className={
        cancelled
          ? "border-border text-muted-foreground"
          : "border-primary/30 bg-primary/10 text-primary"
      }
    >
      {statusLabel(status)}
    </Badge>
  );
}
