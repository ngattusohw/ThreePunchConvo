import react from "react";
import { USER_ROLE_CONFIG, USER_ROLES } from "@/lib/constants";
import Badge from "./badge";
import { checkIsNormalUser } from "@/lib/utils";

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export default function UserRoleBadge({ role }: { role: UserRole }) {
  if (checkIsNormalUser(role)) return null;
  const badgeColor = USER_ROLE_CONFIG[role]?.color || "bg-ufc-gold";
  const badgeTextColor = USER_ROLE_CONFIG[role]?.textColor || "text-white";
  const badgeText = USER_ROLE_CONFIG[role]?.label || role;
  const badgeIcon = USER_ROLE_CONFIG[role]?.icon || false;

  const iconComponent = () => {
    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='mr-1 h-3 w-3'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
          fillRule='evenodd'
          d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
          clipRule='evenodd'
        />
      </svg>
    );
  };
  return (
    <Badge
      text={badgeText}
      color={badgeColor}
      icon={badgeIcon ? iconComponent() : null}
      textColor={badgeTextColor}
    />
  );
}
