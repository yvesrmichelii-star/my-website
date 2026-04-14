import { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig: Record<BookingStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  review: {
    label: "Review",
    icon: CheckCircle,
    className: "bg-success/15 text-success border-success/30",
  },
  reject: {
    label: "Reject",
    icon: XCircle,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  manual_review: {
    label: "Manual Review",
    icon: AlertCircle,
    className: "bg-warning/15 text-warning border-warning/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
