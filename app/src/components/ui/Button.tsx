import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary-pill"
  | "dark-utility"
  | "pearl-capsule"
  | "icon-circular";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  active = false,
  className = "",
  children,
  ...props
}) => {
  let variantClass = "btn-primary";
  if (variant === "secondary-pill") variantClass = "btn-secondary-pill";
  if (variant === "dark-utility") variantClass = "btn-dark-utility";
  if (variant === "pearl-capsule") variantClass = `btn-pearl-capsule ${active ? "active" : ""}`;
  if (variant === "icon-circular") variantClass = "btn-icon-circular";

  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
