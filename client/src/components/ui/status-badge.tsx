import { cn } from "@/lib/utils";
import { UserStatus } from "@/lib/types";
import Badge from "./badge";

interface StatusBadgeProps {
  status?: UserStatus | string | null;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) {
    return null;
  }

  return (
    <Badge text={status} color={getStatusClass(status as UserStatus)} icon={null} textColor="text-white" />
  );
}

function getStatusClass(status: UserStatus): string {
  switch (status) {
    case "HALL OF FAMER":
      return "status-hof";
    case "CHAMPION":
      return "status-champion";
    case "CONTENDER":
      return "status-contender";
    case "RANKED POSTER":
      return "status-ranked";
    case "COMPETITOR":
      return "status-competitor";
    case "REGIONAL POSTER":
      return "status-regional";
    case "AMATEUR":
      return "status-amateur";
    default:
      return "status-amateur";
  }
}
