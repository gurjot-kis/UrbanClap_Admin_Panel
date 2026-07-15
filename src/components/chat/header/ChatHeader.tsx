import { useState, useRef, useEffect } from "react";
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEndChatModalOpen, setIsEndChatModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="position-relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn btn-link btn-sm p-1 text-secondary rounded-circle hover-bg-light"
            style={{ width: "36px", height: "36px" }}
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div
              className="position-absolute end-0 mt-2 bg-white rounded-3 py-2 shadow border border-light"
              style={{ width: "200px", zIndex: 1000 }}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEndChatModalOpen(true);
                }}
                className="d-flex w-100 align-items-center border-0 bg-transparent gap-2 px-3 py-2 text-start text-dark small hover-bg-light"
                style={{ transition: "background-color 0.15s" }}
              >
                <svg
                  className="text-danger"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  style={{ color: "#dc3545" }}
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
            </div>
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

