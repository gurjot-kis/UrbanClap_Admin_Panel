import React from "react";
import OnlineBadge from "./OnlineBadge";

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imageUrl,
  isOnline = false,
  size = "md",
}) => {
  // Map sizes to pixel dimensions
  const dimensions = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const fontSizes = {
    sm: "12px",
    md: "14px",
    lg: "18px",
  };

  const badgeStyles = {
    sm: { width: "10px", height: "10px" },
    md: { width: "12px", height: "12px" },
    lg: { width: "14px", height: "14px" },
  };

  const getMediaUrl = (url?: string) => {
    if (!url) return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    )
      return url;
    const baseUrl = (import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:5000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const firstInitial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className="position-relative d-inline-block flex-shrink-0"
      style={{ width: dimensions[size], height: dimensions[size] }}
    >
      {imageUrl ? (
        <img
          src={getMediaUrl(imageUrl)}
          alt={name}
          className="rounded-circle border border-light object-fit-cover w-100 h-100"
        />
      ) : (
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white font-weight-bold text-uppercase w-100 h-100"
          style={{
            background: "linear-gradient(135deg, #7da8cc, #1b3a5c)",
            fontSize: fontSizes[size],
            fontWeight: 600,
          }}
        >
          {firstInitial}
        </div>
      )}

      <OnlineBadge isOnline={isOnline} style={badgeStyles[size]} />
    </div>
  );
};

export default UserAvatar;
