import { useState } from "react";
import type { FC } from "react";
import { useAppDispatch } from "../../../store/hooks";
import {
  useGetUsersQuery,
  useCreatePrivateConversationMutation,
  useLazyGetMessagesQuery,
} from "../../../features/chat/chatApi";
import { setSelectedConversation, setMessages } from "../../../features/chat/chatSlice";
import type { User } from "../../../features/auth/authTypes";
import UserAvatar from "../shared/UserAvatar";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewChatModal: FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const { data: usersResponse, isLoading } = useGetUsersQuery(search, { skip: !isOpen });
  const [createConversation, { isLoading: isCreating }] = useCreatePrivateConversationMutation();
  const [getMessages] = useLazyGetMessagesQuery();

  if (!isOpen) return null;

  const handleSelectUser = async (receiverId: string) => {
    setError("");
    try {
      const response = await createConversation({ receiverId }).unwrap();
      if (response.success && response.data) {
        const conversation = response.data;
        dispatch(setSelectedConversation(conversation));
        localStorage.setItem("activeConversationId", conversation._id);

        const messagesRes = await getMessages({
          conversationId: conversation._id,
          page: 1,
          limit: 30,
        }).unwrap();

        dispatch(
          setMessages({
            messages: messagesRes.data.messages,
            hasMore: messagesRes.data.hasMore,
            page: messagesRes.data.page,
          })
        );

        onClose();
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to start conversation");
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg flex-column max-vh-80 overflow-hidden">
          {/* Header */}
          <div
            className="modal-header border-0 text-white rounded-top-4"
            style={{ background: "linear-gradient(135deg, #1b3a5c, #2a527d)" }}
          >
            <h5 className="modal-title fw-bold">Start New Chat</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-4 d-flex flex-column" style={{ maxHeight: "450px" }}>
            {error && (
              <div className="alert alert-danger py-2 small mb-3" role="alert">
                {error}
              </div>
            )}

            {/* Search Input */}
            <div className="position-relative mb-3 flex-shrink-0">
              <div
                className="position-absolute top-50 start-0 translate-middle-y ps-3 pointer-events-none d-flex align-items-center"
                style={{ pointerEvents: "none" }}
              >
                <svg
                  className="text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or phone..."
                className="form-control rounded-pill bg-light border-0 small"
                style={{ paddingLeft: "2.5rem", fontSize: "0.85rem" }}
              />
            </div>

            {/* User List */}
            <div className="flex-grow-1 overflow-y-auto" style={{ minHeight: "250px" }}>
              {isLoading || isCreating ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted small">
                  <span className="spinner-border spinner-border-sm mb-2" role="status" />
                  Loading users...
                </div>
              ) : usersResponse?.data && usersResponse.data.length > 0 ? (
                <div className="list-group list-group-flush">
                  {usersResponse.data.map((user: User) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user._id)}
                      className="list-group-item list-group-item-action d-flex align-items-center gap-3 border-0 px-2 py-2.5 rounded-3 cursor-pointer mb-1"
                      style={{ cursor: "pointer" }}
                    >
                      <UserAvatar name={user.name} imageUrl={user.avatar} size="md" />
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: "0.88rem" }}>
                          {user.name}
                        </h6>
                        <p className="mb-0 text-muted text-truncate" style={{ fontSize: "0.75rem" }}>
                          {user.bio || "Hey there! I am using Chat."}
                        </p>
                      </div>
                      <svg
                        className="text-muted flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center text-muted">
                  <span className="fs-3 mb-2">🔍</span>
                  <h6 className="fw-bold mb-1" style={{ fontSize: "0.9rem" }}>
                    No users found
                  </h6>
                  <p className="small mb-0" style={{ fontSize: "0.75rem" }}>
                    Try a different name or phone number
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
