import React from "react";

interface OnlineBadgeProps {
  isOnline: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const OnlineBadge: React.FC<OnlineBadgeProps> = ({ isOnline, className = "", style }) => {
  if (!isOnline) return null;

  return (
    <span
      className={`position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle ${className}`}
      style={{ display: "inline-block", ...style }}
      aria-label="Online"
    />
  );
};

export default OnlineBadge;
