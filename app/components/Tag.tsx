import type { ReactNode, CSSProperties } from "react";

interface TagProps {
  children: ReactNode;
  variant?: "default" | "solid" | "match";
  className?: string;
  style?: CSSProperties;
  clickable?: boolean;
}

export function Tag({
  children,
  variant = "default",
  className = "",
  style = {},
  clickable = true,
}: TagProps) {
  const baseStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    padding: "4px 10px",
    fontWeight: 500,
    textTransform: "uppercase",
    display: "inline-block",
  };

  let variantStyle: React.CSSProperties = {};
  let hoverStyle: React.CSSProperties = {};

  switch (variant) {
    case "solid":
      variantStyle = {
        backgroundColor: "var(--green)",
        color: "var(--white)",
        fontWeight: 600,
        letterSpacing: "0.5px",
      };
      break;
    case "match":
      variantStyle = {
        backgroundColor: "var(--green)",
        color: "var(--white)",
        fontWeight: 600,
        letterSpacing: "0.5px",
      };
      break;
    case "default":
    default:
      variantStyle = {
        backgroundColor: "var(--light)",
        border: "2px solid var(--green)",
        color: "var(--green)",
      };
  }

  const tagContent = (
    <span
      className={className}
      style={{ ...baseStyle, ...variantStyle, ...style }}
    >
      #{children}
    </span>
  );

  if (clickable) {
    return (
      <a 
        href={`/plaques?tag=${children}`}
        style={{
          textDecoration: "none",
          display: "inline-block",
        }}
        onMouseEnter={(e) => {
          const span = e.currentTarget.querySelector('span');
          if (span && variant === "default") {
            span.style.backgroundColor = "var(--green)";
            span.style.color = "var(--white)";
          }
        }}
        onMouseLeave={(e) => {
          const span = e.currentTarget.querySelector('span');
          if (span && variant === "default") {
            span.style.backgroundColor = "var(--light)";
            span.style.color = "var(--green)";
          }
        }}
      >
        {tagContent}
      </a>
    );
  }

  return tagContent;
}
