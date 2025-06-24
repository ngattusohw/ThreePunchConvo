import React from "react";
import Badge from "./badge";

interface FCBadgeProps {
  rank: number;
}

export default function FCBadge({ rank }: FCBadgeProps) {
  return (
    <Badge
      text={`FC: ${rank}`}
      color='bg-ufc-red'
      icon={null}
      textColor='text-white'
    />
  );
}
