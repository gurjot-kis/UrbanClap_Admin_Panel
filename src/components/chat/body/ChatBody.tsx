import { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import InfiniteScrollContainer from "./InfiniteScrollContainer";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { getSocket } from "../../../services/socket";
import {
  useLazyGetMessagesQuery,
  useUploadMultipleMediaMutation,
  useRateConversationMutation,
  chatApi,
} from "../../../features/chat/chatApi";
import {
  prependMessages,
  addMessage,
  addPendingFiles,
  clearPendingFiles,
  removePendingFile,
  clearSelectedConversation,
  clearMessages,
} from "../../../features/chat/chatSlice";
import type { Message } from "../../../features/chat/chatTypes";
import { isAdminRole } from "../../../utils/roles";
import "../chatLayout.css";

const EMPTY_TYPING_MAP: Record<string, string> = {};

const ChatBody = () => {
  const dispatch = useAppDispatch();

  const [getMessages, { isFetching: isFetchingMore }] =
    useLazyGetMessagesQuery();

  const [uploadMultipleMedia, { isLoading: isUploading }] =
    useUploadMultipleMediaMutation();

  const [rateConversation, { isLoading: isRating }] =
    useRateConversationMutation();

  const selectedConversation = useAppSelector(
    (state) => state.chat.selectedConversation,
  );
  const loggedInUser = useAppSelector((state) => state.auth.user);
  const messages = useAppSelector((state) => state.chat.messages);
  const isMessagesLoading = useAppSelector(
    (state) => state.chat.isMessagesLoading,
  );
  const currentPage = useAppSelector((state) => state.chat.currentPage);
  const hasMore = useAppSelector((state) => state.chat.hasMore);
  const pendingFiles = useAppSelector((state) => state.chat.pendingFiles);

  const [loadingOlder, setLoadingOlder] = useState(false);
  // const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMarkerId, setUnreadMarkerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // await handleUploadFiles(e.dataTransfer.files);
      dispatch(addPendingFiles(Array.from(e.dataTransfer.files)));
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!conversationId || files.length === 0) return;

    try {
      const formData = new FormData();
      // for (let i = 0; i < files.length; i++) {
      //   formData.append("files", files[i]);
      // }
      files.forEach((file) => formData.append("files", file));

      const uploadResponse = await uploadMultipleMedia(formData).unwrap();

      if (uploadResponse.success && uploadResponse.data) {
        const socket = getSocket();
        if (!socket) return;

        for (const fileData of uploadResponse.data) {
          const { mediaUrl, messageType } = fileData;
          socket.emit(
            "send_message",
            {
              conversationId,
              text: "",
              messageType,
              mediaUrl,
            },
            (response: { success: boolean; data?: { message: Message } }) => {
              if (response.success && response.data?.message) {
                const sentMessage = response.data.message;
                dispatch(addMessage(sentMessage));

                dispatch(
                  chatApi.util.updateQueryData(
                    "getConversations",
                    undefined,
                    (draft) => {
                      const conv = draft.data.find(
                        (c) => c._id === conversationId,
                      );
                      if (conv) {
                        conv.lastMessage = {
                          _id: sentMessage._id,
                          conversation: sentMessage.conversation,
                          sender: sentMessage.sender._id,
                          messageType: sentMessage.messageType,
                          text: sentMessage.text,
                          mediaUrl: sentMessage.mediaUrl,
                          readBy: sentMessage.readBy,
                          deliveredTo: sentMessage.deliveredTo,
                          createdAt: sentMessage.createdAt,
                          updatedAt: sentMessage.updatedAt,
                        };

                        const index = draft.data.indexOf(conv);
                        if (index > -1) {
                          draft.data.splice(index, 1);
                          draft.data.unshift(conv);
                        }
                      }
                    },
                  ),
                );
              }
            },
          );
        }
      }
    } catch (error) {
      console.error("Failed to upload drag & drop files:", error);
    }
  };

  const handleSendPendingFiles = async () => {
    if (pendingFiles.length === 0) return;
    await handleUploadFiles(pendingFiles);
    dispatch(clearPendingFiles());
  };

  const handleRemovePendingFile = (index: number) => {
    dispatch(removePendingFile(index));
  };

  const handleCancelPendingFiles = () => {
    dispatch(clearPendingFiles());
  };

  const typingUsersMap = useAppSelector(
    (state) =>
      state.chat.typingUsers[selectedConversation?._id || ""] ??
      EMPTY_TYPING_MAP,
  );

  const typingUsers = Object.entries(typingUsersMap).filter(
    ([id]) => id !== loggedInUser?._id,
  );
  const isSomeoneElseTyping = typingUsers.length > 0;

  const conversationId = selectedConversation?._id;

  const conversations = useAppSelector(
    (state) => chatApi.endpoints.getConversations.select()(state).data?.data,
  );
  const currentConvInList = conversations?.find(
    (c) => c._id === conversationId,
  );
  const hasUnreads =
    (currentConvInList?.unreadCount ?? 0) > 0 || unreadCount > 0;

  const startClearUnreadsTimer = () => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = setTimeout(() => {
      setUnreadCount(0);
      setUnreadMarkerId(null);
      clearTimerRef.current = null;
    }, 5000);
  };

  const handleMarkAsRead = () => {
    if (!conversationId) return;

    if (hasUnreads) {
      const socket = getSocket();
      if (socket) {
        socket.emit("mark_as_read", { conversationId });
      }
      dispatch(
        chatApi.util.updateQueryData("getConversations", undefined, (draft) => {
          const conv = draft.data.find((c) => c._id === conversationId);
          if (conv) {
            conv.unreadCount = 0;
          }
        }),
      );
    }
    startClearUnreadsTimer();
  };

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    setUnreadCount(0);
    setUnreadMarkerId(null);
    prevLastMessageIdRef.current = null;

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (conversationId && isFocused) {
      const container = scrollRef.current;
      const isNearBottom = container
        ? container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          200
        : true;
      if (isNearBottom) {
        handleMarkAsRead();
      }
    }
  }, [conversationId, isFocused, unreadCount, hasUnreads]);

  useEffect(() => {
    if (messages.length === 0) {
      prevLastMessageIdRef.current = null;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const currentLastMessageId = lastMessage._id;
    const prevLastMessageId = prevLastMessageIdRef.current;

    prevLastMessageIdRef.current = currentLastMessageId;

    if (!prevLastMessageId || currentLastMessageId === prevLastMessageId) {
      return;
    }

    if (conversationId) {
      const isOwn = lastMessage.sender?._id === loggedInUser?._id;

      if (!isOwn) {
        const container = scrollRef.current;
        const isNearBottom = container
          ? container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            200
          : true;
        const tabFocused = document.hasFocus();

        if (isNearBottom && tabFocused) {
          const socket = getSocket();
          if (socket) {
            socket.emit("mark_as_read", { conversationId });
          }
          dispatch(
            chatApi.util.updateQueryData(
              "getConversations",
              undefined,
              (draft) => {
                const conv = draft.data.find((c) => c._id === conversationId);
                if (conv) {
                  conv.unreadCount = 0;
                }
              },
            ),
          );
        } else {
          if (clearTimerRef.current) {
            clearTimeout(clearTimerRef.current);
            clearTimerRef.current = null;
          }
          setUnreadCount((prev) => prev + 1);
          setUnreadMarkerId((prevMarker) => prevMarker || lastMessage._id);
        }
      }
    }
  }, [messages, conversationId, loggedInUser?._id]);

  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pendingFiles]);

  useEffect(() => {
    if (pendingFiles.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isUploading) {
        e.preventDefault();
        handleSendPendingFiles();
      } else if (e.key === "Escape" && !isUploading) {
        e.preventDefault();
        handleCancelPendingFiles();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pendingFiles, isUploading]);

  const handleLoadMore = async () => {
    if (!conversationId || loadingOlder || !hasMore || isFetchingMore) return;
    setLoadingOlder(true);

    try {
      const nextPage = currentPage + 1;
      const [response] = await Promise.all([
        getMessages({
          conversationId,
          page: nextPage,
          limit: 30,
        }).unwrap(),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);

      dispatch(
        prependMessages({
          messages: response.data.messages,
          hasMore: response.data.hasMore,
          page: response.data.page,
        }),
      );
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleRate = async () => {
    if (!conversationId || rating === 0 || ratingSubmitted) return;
    try {
      await rateConversation({ conversationId, rating }).unwrap();
      setRatingSubmitted(true);
      dispatch(clearSelectedConversation());
      dispatch(clearMessages());
      localStorage.removeItem("activeConversationId");
      dispatch(
        chatApi.util.invalidateTags([
          { type: "Conversation" },
          { type: "Message", id: conversationId },
        ]),
      );
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-grow-1 d-flex flex-column position-relative w-100 overflow-hidden"
      style={{ minHeight: 0 }}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div
          className="position-absolute start-0 top-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(240, 242, 245, 0.97)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          <div
            className="d-flex flex-column align-items-center justify-content-center"
            style={{
              width: "90%",
              height: "85%",
              border: "3px dashed #25D366",
              borderRadius: "24px",
              backgroundColor: "rgba(37, 211, 102, 0.04)",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "88px",
                height: "88px",
                backgroundColor: "#25D366",
                animation: "dropBounce 1s ease-in-out infinite",
              }}
            >
              <svg
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
                width="40"
                height="40"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v12m0-12l-4 4m4-4l4 4M4 20h16"
                />
              </svg>
            </div>
            <h5 className="fw-bold mb-1 text-dark">Drop files to send</h5>
            <p className="small text-muted mb-0">
              Images, videos, and documents are supported
            </p>
          </div>
        </div>
      )}

      {/* File Preview Overlay — shown after drop, before send */}
      {pendingFiles.length > 0 && (
        <div
          className="position-absolute start-0 top-0 w-100 h-100 d-flex flex-column bg-white"
          style={{ zIndex: 30 }}
        >
          {/* Top bar */}
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0">
            <button
              type="button"
              className="btn btn-link text-dark p-0"
              onClick={handleCancelPendingFiles}
              disabled={isUploading}
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <span className="fw-semibold small text-muted">
              {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <div style={{ width: "20px" }} />
          </div>

          {/* Thumbnails grid */}
          <div className="flex-grow-1 overflow-auto d-flex align-items-center justify-content-center p-3">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {pendingFiles.map((file, idx) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                return (
                  <div
                    key={idx}
                    className="position-relative"
                    style={{ width: "140px", height: "140px" }}
                  >
                    <button
                      type="button"
                      className="btn btn-dark rounded-circle position-absolute d-flex align-items-center justify-content-center p-0"
                      style={{
                        top: "-8px",
                        right: "-8px",
                        width: "24px",
                        height: "24px",
                        zIndex: 2,
                      }}
                      onClick={() => handleRemovePendingFile(idx)}
                      disabled={isUploading}
                    >
                      <svg
                        fill="none"
                        stroke="white"
                        viewBox="0 0 24 24"
                        width="12"
                        height="12"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    {isImage ? (
                      <img
                        src={previewUrls[idx]}
                        alt={file.name}
                        className="w-100 h-100 rounded-3 border"
                        style={{ objectFit: "cover" }}
                      />
                    ) : isVideo ? (
                      <video
                        src={previewUrls[idx]}
                        className="w-100 h-100 rounded-3 border"
                        style={{ objectFit: "cover" }}
                        muted
                      />
                    ) : (
                      <div className="w-100 h-100 rounded-3 bg-light border d-flex flex-column align-items-center justify-content-center p-2">
                        <span className="fs-2 mb-1">📄</span>
                        <span className="small text-truncate w-100 text-center px-1">
                          {file.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom send bar */}
          <div className="d-flex align-items-center justify-content-end px-3 py-3 border-top flex-shrink-0 gap-2">
            {isUploading && (
              <span className="small text-muted me-2">Uploading...</span>
            )}
            <button
              type="button"
              className="btn rounded-circle d-flex align-items-center justify-content-center p-0"
              style={{
                width: "52px",
                height: "52px",
                backgroundColor: "#25D366",
                border: "none",
              }}
              onClick={handleSendPendingFiles}
              disabled={isUploading}
            >
              {isUploading ? (
                <span
                  className="spinner-border spinner-border-sm text-white"
                  role="status"
                />
              ) : (
                <svg fill="white" viewBox="0 0 24 24" width="22" height="22">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Uploading Progress Overlay */}
      {isUploading && (
        <div
          className="position-absolute start-0 top-0 w-100 h-100 z-5 d-flex align-items-center justify-content-center bg-black bg-opacity-50"
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-white px-4 py-3 rounded-3 shadow d-flex align-items-center gap-2">
            <span
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            />
            <span className="small text-secondary fw-semibold">
              Sending files...
            </span>
          </div>
        </div>
      )}

      <InfiniteScrollContainer
        onScrollTop={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={loadingOlder}
        messages={messages}
        conversationId={conversationId}
        unreadCount={unreadCount}
        hasUnreads={hasUnreads}
        onMarkAsRead={handleMarkAsRead}
        scrollRef={scrollRef}
        loggedInUserId={loggedInUser?._id}
      >
        {isMessagesLoading ? (
          <div className="msg-skeleton-wrapper">
            {[
              { side: "received", width: 180 },
              { side: "received", width: 110 },
              { side: "sent", width: 150 },
              { side: "received", width: 220 },
              { side: "sent", width: 90 },
              { side: "sent", width: 170 },
              { side: "received", width: 140 },
            ].map((row, i) => (
              <div key={i} className={`msg-skeleton-row ${row.side}`}>
                {row.side === "received" && (
                  <span className="msg-skeleton-bubble msg-skeleton-avatar" />
                )}
                <span
                  className="msg-skeleton-bubble"
                  style={{ width: `${row.width}px` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="msg-list-fade-in">
            <MessageList
              unreadMarkerId={unreadMarkerId}
              unreadCount={unreadCount}
            />
            {isSomeoneElseTyping && (
              <div className="mt-2">
                <TypingIndicator />
              </div>
            )}
          </div>
        )}
      </InfiniteScrollContainer>

      {conversationId && selectedConversation?.isEnded && !isAdminRole(loggedInUser?.role) && !ratingSubmitted && (
        <div
          className="flex-shrink-0 border-top border-light bg-white px-3 py-3"
          style={{ zIndex: 10 }}
        >
          <div className="d-flex flex-column align-items-center text-center">
            <p className="small text-muted mb-2">This chat has been ended. Please rate your experience.</p>
            <div className="d-flex justify-content-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const displayRating = hoverRating || rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="btn btn-link p-0 border-0 bg-transparent"
                    style={{ transition: "transform 0.15s" }}
                  >
                    <svg
                      fill={star <= displayRating ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      className={star <= displayRating ? "text-warning" : "text-muted"}
                      style={{ transition: "color 0.15s, transform 0.15s" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn btn-warning rounded-pill btn-sm px-4"
              onClick={handleRate}
              disabled={isRating || rating === 0}
            >
              {isRating && <span className="spinner-border spinner-border-sm me-1" role="status" />}
              {isRating ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      )}

      {conversationId && selectedConversation?.isEnded && !isAdminRole(loggedInUser?.role) && ratingSubmitted && (
        <div
          className="flex-shrink-0 border-top border-light bg-white px-3 py-3"
          style={{ zIndex: 10 }}
        >
          <div className="d-flex flex-column align-items-center text-center">
            <p className="small text-success fw-semibold mb-0">Thank you for your feedback!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBody;
