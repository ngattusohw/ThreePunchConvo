import React from "react";
import { processTextContent } from "@/lib/link-utils";

interface TextContentProps {
  content: string;
  className?: string;
  maxLines?: number;
}

export default function TextContent({
  content,
  className = "",
  maxLines,
}: TextContentProps) {
  if (!content) return null;

  const processedContent = processTextContent(content);

  const baseClasses = "whitespace-pre-line break-words text-gray-300";
  const lineClampClass = maxLines ? `line-clamp-${maxLines}` : "";
  const combinedClasses = `${baseClasses} ${lineClampClass} ${className}`;

  return (
    <div
      className={combinedClasses}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

// Separate component for titles that might contain links
interface TitleContentProps {
  content: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
}

export function TitleContent({
  content,
  className = "",
  as: Component = "h3",
}: TitleContentProps) {
  if (!content) return null;

  const processedContent = processTextContent(content);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
