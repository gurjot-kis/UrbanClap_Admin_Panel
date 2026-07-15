import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { setReplyingToMessage } from "../../../features/chat/chatSlice";
import SeenIndicator from "./SeenIndicator";
import "./MessageBubble.css";

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    time: string;
    isOwn: boolean;
    status?: "sent" | "delivered" | "seen";
    messageType?: string;
    mediaUrl?: string;
    senderAvatar?: string;
    senderName?: string;
    parentMessage?: {
      _id: string;
      text: string;
      messageType: string;
      senderName: string;
    };
    mediaItems?: {
      id: string;
      mediaUrl: string;
      messageType: string;
      text?: string;
    }[];
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const {
    id,
    isOwn,
    text,
    time,
    status,
    messageType = "text",
    mediaUrl,
    mediaItems,
    parentMessage,
  } = message;
  const dispatch = useAppDispatch();
  const loggedInUser = useAppSelector((state) => state.auth.user);

  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(
    null,
  );
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl =
      (import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:5000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const getFileName = (url?: string) => {
    if (!url) return "File";
    const fullName = url.substring(url.lastIndexOf("/") + 1);
    const parts = fullName.split("-");
    if (parts.length >= 3) {
      return parts.slice(2).join("-");
    }
    return fullName;
  };

  const renderTextWithLinks = (inputText: string, isOwnMessage: boolean) => {
    if (!inputText) return "";

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const parts = inputText.split(urlRegex);

    const linkClass = isOwnMessage
      ? "msg-link-own text-break"
      : "msg-link-received text-break";

    return parts.map((part, index) => {
      if (part.match(/^https?:\/\//i)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const mediaItemsToUse =
    messageType === "media_group"
      ? (mediaItems ?? [])
      : [
          {
            id: message.id,
            mediaUrl: mediaUrl || "",
            messageType: messageType,
            text: text,
          },
        ];

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveLightboxIndex(null);
      setIsClosing(false);
    }, 200);
  };

  useEffect(() => {
    if (activeLightboxIndex === null || mediaItemsToUse.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) =>
          prev === 0 ? mediaItemsToUse.length - 1 : (prev ?? 0) - 1,
        );
      } else if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) =>
          prev === mediaItemsToUse.length - 1 ? 0 : (prev ?? 0) + 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLightboxIndex, mediaItemsToUse]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null && mediaItemsToUse.length > 0) {
      setActiveLightboxIndex((prev) =>
        prev === 0 ? mediaItemsToUse.length - 1 : (prev ?? 0) - 1,
      );
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null && mediaItemsToUse.length > 0) {
      setActiveLightboxIndex((prev) =>
        prev === mediaItemsToUse.length - 1 ? 0 : (prev ?? 0) + 1,
      );
    }
  };

  const handleScrollToParent = (parentId: string) => {
    const el = document.getElementById(`message-${parentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-flash");
      setTimeout(() => {
        el.classList.remove("highlight-flash");
      }, 1500);
    }
  };

  const renderReplyPreview = (parent: {
    _id: string;
    text: string;
    messageType: string;
    senderName: string;
  }) => {
    const displaySnippet = () => {
      if (parent.messageType === "image") return "📷 Photo";
      if (parent.messageType === "video") return "🎥 Video";
      if (parent.messageType === "file") return "📄 File";
      return parent.text;
    };

    return (
      <div
        onClick={() => handleScrollToParent(parent._id)}
        className={`msg-reply-preview mb-2 p-2 text-start border-start border-4 ${isOwn ? "msg-reply-border-own" : "msg-reply-border-received"}`}
        style={{
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        <div
          className={`fw-semibold ${isOwn ? "msg-reply-sender-own" : "msg-reply-sender-received"}`}
        >
          {parent.senderName}
        </div>
        <div
          className="text-truncate"
          style={{ maxWidth: "240px", opacity: 0.9 }}
        >
          {displaySnippet()}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (messageType) {
      case "media_group": {
        if (!mediaItems || mediaItems.length === 0) return null;

        const count = mediaItems.length;
        const gridClass =
          count === 1
            ? ""
            : count === 2
              ? "msg-media-grid-2"
              : count === 3
                ? "msg-media-grid-3"
                : "msg-media-grid-4";

        const itemsToRender = mediaItems.slice(0, 4);

        return (
          <div className="d-flex flex-column gap-2">
            <div className={`msg-media-grid ${gridClass}`}>
              {itemsToRender.map((item, idx) => {
                const isOverLimit = count > 4 && idx === 3;
                return (
                  <div
                    key={item.id}
                    className="msg-media-grid-item"
                    onClick={() => setActiveLightboxIndex(idx)}
                  >
                    {item.messageType === "image" ? (
                      <img
                        src={getMediaUrl(item.mediaUrl)}
                        alt="Uploaded media"
                      />
                    ) : (
                      <>
                        <video
                          src={getMediaUrl(item.mediaUrl)}
                          muted
                          playsInline
                        />
                        <div className="msg-media-play-icon">
                          <svg
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            width="28"
                            height="28"
                            className="text-white"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </>
                    )}
                    {isOverLimit && (
                      <div className="msg-media-grid-overlay">+{count - 3}</div>
                    )}
                  </div>
                );
              })}
            </div>
            {text && (
              <p
                className="mb-0 mt-1 px-1 text-break"
                style={{ fontSize: "0.85rem", lineHeight: 1.5 }}
              >
                {renderTextWithLinks(text, isOwn)}
              </p>
            )}
          </div>
        );
      }
      case "image":
        return (
          <div className="d-flex flex-column">
            <div
              onClick={() => setActiveLightboxIndex(0)}
              className="msg-media-item rounded-3"
              style={{ maxWidth: "300px" }}
            >
              <img
                src={getMediaUrl(mediaUrl)}
                alt="Image attachment"
                className="w-100 rounded-3 object-fit-contain"
                style={{ maxHeight: "260px" }}
              />
            </div>
            {text && (
              <p
                className="mb-0 mt-2 px-1 text-break"
                style={{ fontSize: "0.85rem", lineHeight: 1.5 }}
              >
                {renderTextWithLinks(text, isOwn)}
              </p>
            )}
          </div>
        );
      case "video":
        return (
          <div className="d-flex flex-column">
            <div
              onClick={() => setActiveLightboxIndex(0)}
              className="msg-media-item rounded-3"
              style={{ maxWidth: "300px" }}
            >
              <video
                src={getMediaUrl(mediaUrl)}
                className="w-100 rounded-3"
                style={{ maxHeight: "260px" }}
                muted
                playsInline
              />
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-10">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-lg"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    style={{ marginLeft: "2px" }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            {text && (
              <p
                className="mb-0 mt-2 px-1 text-break"
                style={{ fontSize: "0.85rem", lineHeight: 1.5 }}
              >
                {renderTextWithLinks(text, isOwn)}
              </p>
            )}
          </div>
        );
      case "file":
        return (
          <div className="d-flex flex-column" style={{ maxWidth: "300px" }}>
            <a
              href={getMediaUrl(mediaUrl)}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={`msg-file-card d-flex align-items-center p-3 rounded-3 border ${
                isOwn ? "border-0" : "border"
              }`}
              style={{
                backgroundColor: isOwn ? "rgba(255,255,255,0.16)" : "#f8fafc",
                borderColor: isOwn ? "transparent" : "#eef1f5",
                color: isOwn ? "#ffffff" : "#111827",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white flex-shrink-0 me-3 shadow-sm"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: isOwn ? "#0d9488" : "#6366f1",
                }}
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-grow-1 min-w-0 text-start">
                <p className="mb-0 fw-semibold small text-truncate">
                  {getFileName(mediaUrl)}
                </p>
                <p className="mb-0" style={{ fontSize: "11px", opacity: 0.75 }}>
                  Click to open/download
                </p>
              </div>
            </a>
            {text && (
              <p
                className="mb-0 mt-2 px-1 text-break"
                style={{ fontSize: "0.85rem", lineHeight: 1.5 }}
              >
                {renderTextWithLinks(text, isOwn)}
              </p>
            )}
          </div>
        );
      case "text":
      default:
        return (
          <p className="mb-0 text-break" style={{ lineHeight: 1.5 }}>
            {renderTextWithLinks(text, isOwn)}
          </p>
        );
    }
  };

  const useCompactPadding =
    (messageType === "image" ||
      messageType === "video" ||
      messageType === "media_group") &&
    !text;

  const renderLightbox = () => {
    if (
      activeLightboxIndex === null ||
      mediaItemsToUse.length === 0 ||
      !mounted
    )
      return null;

    const lightboxContent = (
      <div
        className={`lightbox-overlay ${isClosing ? "lightbox-fade-out" : "lightbox-fade-in"}`}
        onClick={handleClose}
      >
        {/* Header toolbar */}
        <div
          className="position-absolute top-0 start-0 w-100 p-3 d-flex align-items-center justify-content-between text-white"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
            zIndex: 10,
          }}
        >
          <span className="small fw-semibold">
            {activeLightboxIndex + 1} / {mediaItemsToUse.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="btn btn-link btn-sm text-white p-2 rounded-circle"
            aria-label="Close lightbox"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Left Arrow */}
        {mediaItemsToUse.length > 1 && (
          <button
            onClick={handlePrev}
            className="lightbox-nav-btn position-absolute start-0 ms-4"
            style={{ zIndex: 3 }}
            aria-label="Previous"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Center Content */}
        <div
          className={`lightbox-content ${isClosing ? "lightbox-scale-out" : "lightbox-scale-in"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {mediaItemsToUse[activeLightboxIndex].messageType === "image" ? (
            <img
              src={getMediaUrl(mediaItemsToUse[activeLightboxIndex].mediaUrl)}
              alt="Fullscreen view"
              className="img-fluid rounded-3 shadow-lg object-fit-contain"
              style={{ maxHeight: "70vh" }}
            />
          ) : (
            <video
              src={getMediaUrl(mediaItemsToUse[activeLightboxIndex].mediaUrl)}
              controls
              autoPlay
              className="rounded-3 shadow-lg w-100 object-fit-contain"
              style={{ maxHeight: "70vh", maxWidth: "100%" }}
            />
          )}

          {mediaItemsToUse[activeLightboxIndex].text && (
            <p
              className="text-white text-center rounded-3 px-3 py-2 mb-0"
              style={{
                backgroundColor: "rgba(0,0,0,0.4)",
                fontSize: "0.85rem",
                maxWidth: "500px",
              }}
            >
              {renderTextWithLinks(
                mediaItemsToUse[activeLightboxIndex].text || "",
                true,
              )}
            </p>
          )}
        </div>

        {/* Right Arrow */}
        {mediaItemsToUse.length > 1 && (
          <button
            onClick={handleNext}
            className="lightbox-nav-btn position-absolute end-0 me-4"
            style={{ zIndex: 3 }}
            aria-label="Next"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    );

    return createPortal(lightboxContent, document.body);
  };

  const handleReplyClick = () => {
    dispatch(
      setReplyingToMessage({
        _id: id,
        text: text || "",
        messageType,
        mediaUrl,
        sender: {
          _id: isOwn ? loggedInUser?._id || "" : "",
          name: isOwn
            ? loggedInUser?.name || "Me"
            : message.senderName || "User",
          phone: "",
        },
        readBy: [],
        deliveredTo: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any),
    );
  };

  const replyButton = (
    <button
      type="button"
      onClick={handleReplyClick}
      className="msg-reply-btn"
      title="Reply"
      aria-label="Reply"
    >
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    </button>
  );

  const bubble = (
    <div
      className={`msg-bubble-shadow ${isOwn ? "msg-bubble-own" : "msg-bubble-received"}`}
      style={{ padding: useCompactPadding ? "4px" : "12px 16px" }}
    >
      {parentMessage && renderReplyPreview(parentMessage)}
      {renderContent()}
    </div>
  );

  const timestampRow = (
    <div className="d-flex align-items-center mt-1 px-1 gap-1">
      <span className="text-muted fw-medium" style={{ fontSize: "0.68rem" }}>
        {time}
      </span>
      {isOwn && status && <SeenIndicator status={status} />}
    </div>
  );

  return (
    <>
      <div
        className={`msg-row w-100 d-flex mb-2 align-items-center ${isOwn ? "justify-content-end" : "justify-content-start"}`}
      >
        {isOwn && <div className="me-3">{replyButton}</div>}

        <div
          id={`message-${id}`}
          className={`d-flex flex-column ${isOwn ? "align-items-end" : "align-items-start"}`}
          style={{ maxWidth: "70%" }}
        >
          {bubble}
          {timestampRow}
        </div>

        {!isOwn && <div className="ms-3">{replyButton}</div>}
      </div>
      {renderLightbox()}
    </>
  );
};

export default MessageBubble;
