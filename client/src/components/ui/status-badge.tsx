import { UserStatus } from "@/lib/types";
import Badge from "./badge";
import { USER_STATUSES } from "@/lib/constants";

interface StatusBadgeProps {
  status?: UserStatus | string | null;
  className?: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return null;
  }

  // Convert status string to match USER_STATUSES keys (replace spaces with underscores)
  const statusKey = status.replace(/ /g, "_") as keyof typeof USER_STATUSES;

  // Get config from constants, with fallback to AMATEUR
  const config = USER_STATUSES[statusKey] || USER_STATUSES.AMATEUR;

  return <Badge text={config.label} className={config.className} icon={null} />;
}
