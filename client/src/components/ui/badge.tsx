import react, { ReactNode } from "react";

export function Badge({
  text,
  color = '',
  icon,
  textColor = "text-white",
  className='',
}: {
  text: string;
  color?: string;
  icon: ReactNode;
  textColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full ${color} px-2 py-0.5 text-xs font-bold ${textColor} ${className}`}
    >
      {icon && icon}
      {text}
    </span>
  );
}

export default Badge;
