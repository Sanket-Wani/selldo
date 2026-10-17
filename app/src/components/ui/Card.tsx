import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Store Utility Card component from DESIGN-apple.md:
 * - Canvas background
 * - 1px hairline border
 * - Border-radius: lg (18px)
 * - Padding: lg (24px)
 * - Box shadow: NONE (per DESIGN-apple.md §Elevation & Depth)
 */
export const Card: React.FC<CardProps> = ({ className = "", children, ...props }) => {
  return (
    <div className={`store-utility-card ${className}`} {...props}>
      {children}
    </div>
  );
};
