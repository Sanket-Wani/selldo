import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "pearl" | "simulated" | "active";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "pearl",
  className = "",
}) => {
  if (variant === "simulated") {
    return <span className={`badge-simulated ${className}`}>[SIMULATED] {children}</span>;
  }

  return (
    <span
      className={`btn-pearl-capsule ${variant === "active" ? "active" : ""} ${className}`}
      style={{ cursor: "default", pointerEvents: "none" }}
    >
      {children}
    </span>
  );
};
