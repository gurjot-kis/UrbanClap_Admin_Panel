import { useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import UserStatus from "./UserStatus";
import EndChatModal from "./EndChatModal";
import { isAdminRole } from "../../../utils/roles";

const EMPTY_TYPING_MAP: Record<string, string> = {};

const ChatHeader = () => {
  const conversation = useAppSelector(
    (state) => state.chat.selectedConversation
  );
  const loggedInUser = useAppSelector((state) => state.auth.user);
  const typingUsersMap = useAppSelector(
    (state) =>
      state.chat.typingUsers[conversation?._id || ""] ?? EMPTY_TYPING_MAP
  );
  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);

  const [isEndChatModalOpen, setIsEndChatModalOpen] = useState(false);

  if (!conversation) return null;

  const isOnline = conversation.user?._id ? onlineUsers.includes(conversation.user._id) : false;
  const typingUsers = Object.entries(typingUsersMap).filter(
    ([id]) => id !== loggedInUser?._id
  );
  const isSomeoneElseTyping = typingUsers.length > 0;
  const statusText = isSomeoneElseTyping
    ? "Typing..."
    : isOnline
      ? "Online"
      : "Offline";
  const isAdmin = isAdminRole(loggedInUser?.role);

  return (
    <header
      className="chat-main-header d-flex align-items-center justify-content-between px-3 border-bottom border-light bg-white"
      style={{ height: "64px" }}
    >
      <UserStatus
        user={{
          name: conversation.user?.name || conversation.groupName || "Chat",
          isOnline: isOnline,
          status: statusText,
          avatar: conversation.user?.profilePicture || conversation.groupImage || "",
        }}
      />

      {isAdmin && (
        <div className="d-flex align-items-center gap-2">
          {!conversation.isEnded ? (
            <button
              onClick={() => setIsEndChatModalOpen(true)}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fw-semibold"
              style={{ fontSize: "0.82rem", transition: "all 0.2s ease" }}
            >
              <svg
                className="me-1"
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
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
              End Chat
            </button>
          ) : (
            <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-semibold border border-danger-subtle" style={{ fontSize: "0.8rem" }}>
              Chat Ended
            </span>
          )}

          <EndChatModal
            isOpen={isEndChatModalOpen}
            onClose={() => setIsEndChatModalOpen(false)}
            userName={conversation.user?.name || conversation.groupName || "Chat"}
            conversationId={conversation._id}
          />
        </div>
      )}
    </header>
  );
};

export default ChatHeader;

