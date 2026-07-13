import React from "react";

interface SeenIndicatorProps {
  status: "sent" | "delivered" | "seen";
}

const SeenIndicator: React.FC<SeenIndicatorProps> = ({ status }) => {
  if (status === "sent") {
    return (
      <svg
        className="text-secondary opacity-75"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        width="14"
        height="14"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  return (
    <div className="position-relative d-inline-flex align-items-center">
      <svg
        className={status === "seen" ? "text-primary" : "text-secondary opacity-75"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        width="14"
        height="14"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <svg
        className={status === "seen" ? "text-primary" : "text-secondary opacity-75"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        style={{ marginLeft: "-6px" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );
};

export default SeenIndicator;
