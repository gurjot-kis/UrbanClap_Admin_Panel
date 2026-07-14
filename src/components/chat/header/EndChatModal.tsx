import { useEndConversationMutation } from "../../../features/chat/chatApi";
import { useAppDispatch } from "../../../store/hooks";
import { clearSelectedConversation } from "../../../features/chat/chatSlice";

interface EndChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  conversationId: string;
}

const EndChatModal = ({ isOpen, onClose, userName, conversationId }: EndChatModalProps) => {
  const dispatch = useAppDispatch();
  const [endConversation, { isLoading }] = useEndConversationMutation();

  const handleEndChat = async () => {
    try {
      await endConversation({ conversationId, end_chat: true }).unwrap();
      dispatch(clearSelectedConversation());
      localStorage.removeItem("activeConversationId");
      onClose();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1055 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content border-0 rounded-4 shadow-lg">
          <div className="modal-body p-4 text-center">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning rounded-circle mb-3"
              style={{ width: "48px", height: "48px" }}
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
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h5 className="modal-title fw-bold mb-2">End Chat</h5>
            <p className="text-muted small mb-4">
              Are you sure you want to end the chat with{" "}
              <span className="fw-bold text-dark">{userName}</span>?
            </p>

            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-light rounded-pill btn-sm px-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-warning rounded-pill btn-sm px-4 d-flex align-items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEndChat();
                }}
                disabled={isLoading}
              >
                {isLoading && (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />
                )}
                {isLoading ? "Ending..." : "End Chat"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndChatModal;
