import react, { ReactNode } from "react";

export function Badge({
  text,
  color = "",
  icon = null,
  textColor = "text-white",
  className = "",
}: {
  text: string;
  color?: string;
  icon: ReactNode;
  textColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md ${color} px-2 py-0.5 text-xs font-bold ${textColor} ${className}`}
    >
      {icon && icon}
      {text}
    </span>
  );
}

export default Badge;
