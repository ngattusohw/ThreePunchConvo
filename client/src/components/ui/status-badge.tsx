import React from 'react';
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

  return (
    <Badge
      text={status}
      className={USER_STATUSES[status as UserStatus]?.className}
      icon={null}
    />
  );
}
