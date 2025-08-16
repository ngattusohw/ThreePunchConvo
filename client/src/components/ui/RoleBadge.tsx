import react from "react";
import { USER_ROLE_CONFIG, USER_ROLES } from "@/lib/constants";
import Badge from "./badge";

type RoleBadge = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// for admin view
export default function RoleBadge({ role }: { role: UserRole }) {
  const badgeColor = USER_ROLE_CONFIG[role]?.color || "bg-ufc-gold";
  const badgeTextColor = USER_ROLE_CONFIG[role]?.textColor || "text-white";
  const badgeText = USER_ROLE_CONFIG[role]?.label || role;

  return (
    <Badge
      text={badgeText}
      color={badgeColor}
      textColor={badgeTextColor}
    />
  );
}
