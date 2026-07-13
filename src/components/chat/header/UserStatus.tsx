import UserAvatar from "../shared/UserAvatar";
import { useAppDispatch } from "../../../store/hooks";
import { setSelectedConversation } from "../../../features/chat/chatSlice";

interface UserStatusProps {
  user: {
    name: string;
    status: string;
    isOnline: boolean;
    avatar: string;
  };
}

const UserStatus = ({ user }: UserStatusProps) => {
  const dispatch = useAppDispatch();

  const handleBack = () => {
    dispatch(setSelectedConversation(null));
    localStorage.removeItem("activeConversationId");
  };

  const isTyping = user.status.toLowerCase().includes("typing");

  return (
    <div className="d-flex align-items-center gap-3">
      {/* Mobile Back Button */}
      <button
        onClick={handleBack}
        className="btn btn-link btn-sm p-1 text-secondary d-md-none rounded-circle hover-bg-light"
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
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="d-flex align-items-center gap-3 cursor-pointer p-1 rounded-3 hover-bg-light">
        <UserAvatar
          name={user.name}
          imageUrl={user.avatar}
          isOnline={user.isOnline}
          size="md"
        />

        <div className="d-flex flex-column justify-content-center">
          <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: "0.92rem", lineHeight: "1.2" }}>
            {user.name}
          </h6>
          <span
            className={`small mt-0.5 ${
              isTyping
                ? "text-success fw-bold animate-pulse"
                : user.status === "Online"
                  ? "text-success fw-medium"
                  : "text-muted"
            }`}
            style={{ fontSize: "0.75rem" }}
          >
            {user.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserStatus;
