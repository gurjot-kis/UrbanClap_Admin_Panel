import { useAppSelector } from "../../../store/hooks";
import UserStatus from "./UserStatus";

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
    </header>
  );
};

export default ChatHeader;
