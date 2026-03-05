import { Link } from "react-router";
import type { ReactNode, CSSProperties } from "react";

interface TagProps {
  children: ReactNode;
  variant?: "default" | "solid";
  className?: string;
  style?: CSSProperties;
  clickable?: boolean;
  to?: string;
}

export function Tag({
  children,
  variant = "default",
  className = "",
  style = {},
  clickable = true,
  to,
}: TagProps) {
  const baseClasses = "tag";
  const variantClasses = variant === "solid" ? "solid" : "";
  const combinedClasses = `${baseClasses} ${variantClasses} ${className}`.trim();

  const content = (
    <span className={combinedClasses} style={style}>
      #{children}
    </span>
  );

  if (clickable) {
    const href = to || `/plaques?tag=${encodeURIComponent(String(children))}`;
    return (
      <Link 
        to={href}
        style={{ textDecoration: "none", display: "inline-block" }}
        aria-label={`Filter by tag: ${children}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
