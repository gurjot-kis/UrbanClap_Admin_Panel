import { useState } from "react";
import type { Conversation } from "../../../features/chat/chatTypes";
import {
  useLazyGetMessagesQuery,
  useDeleteConversationMutation,
  chatApi,
} from "../../../features/chat/chatApi";
import {
  setMessages,
  setSelectedConversation,
  clearMessages,
} from "../../../features/chat/chatSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import UserAvatar from "../shared/UserAvatar";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface Props {
  conversation: Conversation;
}

export default function ConversationItem({ conversation }: Props) {
  const dispatch = useAppDispatch();
  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);
  const isOnline = conversation.user?._id ? onlineUsers.includes(conversation.user._id) : false;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [getMessages] = useLazyGetMessagesQuery();
  const [deleteConversation, { isLoading: isDeleting }] = useDeleteConversationMutation();

  const handleSelectConversation = async () => {
    try {
      localStorage.setItem("activeConversationId", conversation._id);
      dispatch(setSelectedConversation(conversation));

      dispatch(
        chatApi.util.updateQueryData("getConversations", undefined, (draft) => {
          const conv = draft.data.find((c) => c._id === conversation._id);
          if (conv) {
            conv.unreadCount = 0;
          }
        })
      );

      const response = await getMessages({
        conversationId: conversation._id,
        page: 1,
        limit: 20,
      }).unwrap();

      dispatch(
        setMessages({
          messages: response.data.messages,
          hasMore: response.data.hasMore,
          page: response.data.page,
        })
      );
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const handleDeleteClick = async () => {
    const selectedId = selectedConversation?._id ? String(selectedConversation._id) : "";
    const currentId = conversation?._id ? String(conversation._id) : "";
    const isCurrentlyActive = isActive || (selectedId && selectedId === currentId);

    const savedActiveId = localStorage.getItem("activeConversationId");
    if (savedActiveId && String(savedActiveId) === currentId) {
      localStorage.removeItem("activeConversationId");
    }

    if (isCurrentlyActive) {
      dispatch(setSelectedConversation(null));
      dispatch(clearMessages());
    }

    setIsDeleteModalOpen(false);

    try {
      await deleteConversation(conversation._id).unwrap();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const renderLastMessage = () => {
    const lastMsg = conversation.lastMessage;
    if (!lastMsg) return { icon: null, text: "No messages yet" };

    const type = lastMsg.messageType || "text";
    const text = lastMsg.text;

    if (type === "image") {
      return { icon: "📷", text: text || "Photo" };
    }
    if (type === "video") {
      return { icon: "🎥", text: text || "Video" };
    }
    if (type === "file") {
      return { icon: "📁", text: text || "Document" };
    }
    return { icon: null, text: text || "No messages yet" };
  };

  const renderTimestamp = () => {
    const lastMsg = conversation.lastMessage;
    if (!lastMsg) return "";

    const date = new Date(lastMsg.createdAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const withinWeek = now.getTime() - date.getTime() < 6 * 24 * 60 * 60 * 1000;

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) {
      return "Yesterday";
    }
    if (withinWeek) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "short" });
  };

  const selectedConversation = useAppSelector(
    (state) => state.chat.selectedConversation
  );
  const isActive = selectedConversation?._id === conversation._id;
  const hasUnread = !!conversation.unreadCount && conversation.unreadCount > 0;
  const { icon, text } = renderLastMessage();

  return (
    <div
      onClick={handleSelectConversation}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleSelectConversation();
      }}
      className={`conversation-item position-relative ${isActive ? "active" : ""}`}
      style={{ outline: "none" }}
    >
      {/* Avatar */}
      <UserAvatar
        name={conversation.user?.name || conversation.groupName || "Chat"}
        imageUrl={conversation.user.profilePicture || conversation.groupImage || undefined}
        isOnline={isOnline}
        size="md"
      />

      <div className="conversation-item-details flex-grow-1 overflow-hidden">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <h6
            className={`conversation-item-name mb-0 text-truncate ${
              hasUnread ? "fw-bold text-dark" : "fw-semibold text-secondary"
            }`}
            style={{ fontSize: "0.9rem" }}
          >
            {conversation.user?.name || conversation.groupName || "Chat"}
          </h6>
          <span
            className={`conversation-item-time flex-shrink-0 ${
              hasUnread ? "text-primary fw-semibold" : "text-muted"
            }`}
            style={{ fontSize: "0.75rem" }}
          >
            {renderTimestamp()}
          </span>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
          <p
            className={`conversation-item-lastmsg mb-0 text-truncate ${
              hasUnread ? "text-dark fw-medium" : "text-muted"
            }`}
            style={{ fontSize: "0.8rem" }}
          >
            {icon && <span className="me-1">{icon}</span>}
            {text}
          </p>

          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            {/* Trash button on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              className="btn btn-link btn-sm p-0 border-0 text-muted hover-danger delete-conv-btn"
              style={{ display: "none" }}
              title="Delete conversation"
              disabled={isDeleting}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {hasUnread ? (
              <span className="badge rounded-pill bg-danger d-flex align-items-center justify-content-center px-1.5" style={{ minWidth: "20px", height: "20px", fontSize: "0.7rem" }}>
                {conversation.unreadCount! > 99 ? "99+" : conversation.unreadCount}
              </span>
            ) : (
              <span style={{ width: "20px", height: "20px" }} />
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteClick}
        title={conversation.user?.name || conversation.groupName || "Chat"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
