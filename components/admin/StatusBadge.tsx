import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "resume" | "interview" | "overall";
}

export function StatusBadge({ status, type = "overall" }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let className = "";

  const s = status?.toLowerCase() || "";

  if (s === "passed" || s === "promoted" || s === "strong hire" || s === "hire") {
    variant = "default";
    className = "bg-green-600 hover:bg-green-700";
  } else if (s === "failed" || s === "no hire" || s === "locked" || s === "expired") {
    variant = "destructive";
  } else if (s === "completed") {
    variant = "default";
    className = "bg-blue-600 hover:bg-blue-700";
  } else if (s === "active" || s === "enabled") {
    variant = "default";
    className = "bg-emerald-600 hover:bg-emerald-700";
  } else if (s === "pending" || s === "not started") {
    variant = "secondary";
    className = "bg-gray-200 text-gray-700 hover:bg-gray-300";
  }

  return (
    <Badge variant={variant} className={cn("capitalize px-2 py-0.5", className)}>
      {status}
    </Badge>
  );
}
