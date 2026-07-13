import { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import InfiniteScrollContainer from "./InfiniteScrollContainer";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { getSocket } from "../../../services/socket";
import {
  useLazyGetMessagesQuery,
  useUploadMultipleMediaMutation,
  chatApi,
} from "../../../features/chat/chatApi";
import { prependMessages, addMessage } from "../../../features/chat/chatSlice";
import type { Message } from "../../../features/chat/chatTypes";

const EMPTY_TYPING_MAP: Record<string, string> = {};

const ChatBody = () => {
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [getMessages, { isFetching: isFetchingMore }] =
    useLazyGetMessagesQuery();
  const [loadingOlder, setLoadingOlder] = useState(false);

  const selectedConversation = useAppSelector(
    (state) => state.chat.selectedConversation,
  );
  const loggedInUser = useAppSelector((state) => state.auth.user);
  const messages = useAppSelector((state) => state.chat.messages);
  const currentPage = useAppSelector((state) => state.chat.currentPage);
  const hasMore = useAppSelector((state) => state.chat.hasMore);

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMarkerId, setUnreadMarkerId] = useState<string | null>(null);

  const [uploadMultipleMedia, { isLoading: isUploading }] =
    useUploadMultipleMediaMutation();
  const [isDragging, setIsDragging] = useState(false);
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
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    if (!conversationId) return;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

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

  const [isFocused, setIsFocused] = useState(true);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleLoadMore = async () => {
    if (!conversationId || loadingOlder || !hasMore || isFetchingMore) return;
    setLoadingOlder(true);

    try {
      const nextPage = currentPage + 1;
      const [response] = await Promise.all([
        getMessages({
          conversationId,
          page: nextPage,
          limit: 20,
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
          className="position-absolute start-0 top-0 w-100 h-100 z-5 d-flex flex-column align-items-center justify-content-center bg-light bg-opacity-25"
          style={{
            backdropFilter: "blur(4px)",
            border: "2px dashed #0d6efd",
            pointerEvents: "none",
          }}
        >
          <div className="card shadow-lg p-4 text-center border-0 rounded-4">
            <span className="fs-1 mb-2 d-block">📤</span>
            <h6 className="fw-bold mb-1">Drag & Drop files here</h6>
            <p
              className="small text-muted mb-0"
              style={{ maxWidth: "220px", fontSize: "0.75rem" }}
            >
              Upload files to send them to this chat.
            </p>
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
        <MessageList
          unreadMarkerId={unreadMarkerId}
          unreadCount={unreadCount}
        />

        {isSomeoneElseTyping && (
          <div className="mt-2">
            <TypingIndicator />
          </div>
        )}
      </InfiniteScrollContainer>
    </div>
  );
};

export default ChatBody;
