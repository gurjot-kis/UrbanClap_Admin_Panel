import { useEffect, useState } from "react";
import {
  useGetConversationsQuery,
  useLazyGetMessagesQuery,
  useGetConversationUsersQuery,
  useGetSuperadminsQuery,
  useCreatePrivateConversationMutation,
} from "../../../features/chat/chatApi";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSelectedConversation, setMessages } from "../../../features/chat/chatSlice";
import type { User } from "../../../features/auth/authTypes";
import { isVendorRole } from "../../../utils/roles";
import UserAvatar from "../shared/UserAvatar";
import ConversationItem from "./ConversationItem";
import SearchConversation from "./SearchConversation";
import NewChatModal from "./NewChatModal";

const ConversationSkeleton = () => (
  <div className="d-flex align-items-center gap-3 px-3 py-2.5 placeholder-glow border-bottom">
    <div
      className="placeholder rounded-circle flex-shrink-0"
      style={{ width: "42px", height: "42px" }}
    />
    <div className="flex-grow-1 d-flex flex-column gap-2">
      <div className="d-flex justify-content-between">
        <span className="placeholder rounded col-4" style={{ height: "12px" }}></span>
        <span className="placeholder rounded col-2" style={{ height: "10px" }}></span>
      </div>
      <span className="placeholder rounded col-7" style={{ height: "10px" }}></span>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 px-4 text-center">
    <div
      className="d-flex align-items-center justify-content-center rounded-circle bg-light mb-3 text-secondary"
      style={{ width: "56px", height: "56px" }}
    >
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.083 0-2.12-.17-3.08-.484L3 20l1.514-4.03A7.947 7.947 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>
    <h6 className="fw-bold mb-1" style={{ fontSize: "0.9rem" }}>
      No conversations yet
    </h6>
    <p className="text-muted small mb-0" style={{ maxWidth: "200px", fontSize: "0.78rem" }}>
      Start a new chat to connect with someone.
    </p>
  </div>
);

const ChatSidebar = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const selectedConversation = useAppSelector((state) => state.chat.selectedConversation);
  const [getMessages] = useLazyGetMessagesQuery();

  const { data, isLoading } = useGetConversationsQuery();
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const { data: conversationUsersResponse, isLoading: isConversationUsersLoading } =
    useGetConversationUsersQuery(searchQuery, {
      skip: !searchQuery.trim(),
    });
  const { data: superadminsResponse, isLoading: isSuperadminsLoading } = useGetSuperadminsQuery();
  const [createConversation, { isLoading: isCreating }] = useCreatePrivateConversationMutation();
  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);

  const isVendor = isVendorRole(currentUser?.role);

  useEffect(() => {
    if (isLoading || !data?.data || selectedConversation) return;

    const savedId = localStorage.getItem("activeConversationId");
    if (savedId) {
      const savedConv = data.data.find((c) => c._id === savedId);
      if (savedConv) {
        const autoSelect = async () => {
          try {
            dispatch(setSelectedConversation(savedConv));
            const response = await getMessages({
              conversationId: savedConv._id,
              page: 1,
              limit: 30,
            }).unwrap();
            dispatch(
              setMessages({
                messages: response.data.messages,
                hasMore: response.data.hasMore,
                page: response.data.page,
              })
            );
          } catch (error) {
            console.error("Auto load messages failed", error);
          }
        };
        autoSelect();
      }
    }
  }, [data, isLoading, selectedConversation, dispatch, getMessages]);

  const handleSelectUser = async (user: User) => {
    setError("");
    try {
      const existingConv = data?.data?.find((c) => c.user?._id === user._id);
      if (existingConv) {
        dispatch(setSelectedConversation(existingConv));
        localStorage.setItem("activeConversationId", existingConv._id);

        const response = await getMessages({
          conversationId: existingConv._id,
          page: 1,
          limit: 30,
        }).unwrap();

        dispatch(
          setMessages({
            messages: response.data.messages,
            hasMore: response.data.hasMore,
            page: response.data.page,
          })
        );

        setSearchQuery("");
        return;
      }

      const response = await createConversation({ receiverId: user._id }).unwrap();
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

        setSearchQuery("");
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to start conversation");
    }
  };

  return (
    <aside className="chat-sidebar d-flex flex-column h-100">
      {/* <SidebarHeader /> */}

      {isVendor ? (
        <div className="chat-conversations-list flex-grow-1 overflow-auto">
          <div className="px-3 py-3 border-bottom flex-shrink-0">
            <h6 className="fw-bold mb-0" style={{ fontSize: "0.85rem", color: "#1b3a5c" }}>
              Support Team Contacts
            </h6>
          </div>
          {error && (
            <div className="alert alert-danger py-2 small mx-3 my-2" role="alert">
              {error}
            </div>
          )}
          {isSuperadminsLoading || isCreating ? (
            <div className="d-flex align-items-center justify-content-center py-5 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Loading admins...
            </div>
          ) : superadminsResponse?.data && superadminsResponse.data.length > 0 ? (
            <div className="list-group list-group-flush">
              {superadminsResponse.data.map((admin: User) => {
                const existingConv = data?.data?.find(
                  (c) => c.user?._id === admin._id,
                );
                const isActiveAdmin = selectedConversation?.user?._id === admin._id;
                const isOnline = onlineUsers.includes(admin._id);
                const hasUnread = !!existingConv?.unreadCount && existingConv.unreadCount > 0;

                return (
                  <div
                    key={admin._id}
                    onClick={() => handleSelectUser(admin)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleSelectUser(admin);
                    }}
                    className={`conversation-item position-relative ${isActiveAdmin ? "active" : ""}`}
                    style={{ outline: "none", cursor: "pointer" }}
                  >
                    <UserAvatar name={admin.name} imageUrl={admin.profilePicture || admin.avatar} isOnline={isOnline} size="md" />
                    <div className="conversation-item-details flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <h6
                          className={`conversation-item-name mb-0 text-truncate ${
                            hasUnread ? "fw-bold text-dark" : "fw-semibold text-secondary"
                          }`}
                          style={{ fontSize: "0.9rem" }}
                        >
                          {admin.name}
                        </h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
                        <p className="conversation-item-lastmsg mb-0 text-truncate text-muted" style={{ fontSize: "0.8rem" }}>
                          Support Team
                        </p>
                        {hasUnread && !isActiveAdmin && (
                          <span className="badge rounded-pill bg-danger d-flex align-items-center justify-content-center px-1.5" style={{ minWidth: "20px", height: "20px", fontSize: "0.7rem" }}>
                            {existingConv.unreadCount! > 99 ? "99+" : existingConv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted small mb-0 text-center py-5">No admins available</p>
          )}
        </div>
      ) : (
        <>
          <div className="px-3 py-3 border-bottom flex-shrink-0">
            <SearchConversation value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="chat-conversations-list flex-grow-1 overflow-auto">
            {error && (
              <div className="alert alert-danger py-2 small mx-3 my-2" role="alert">
                {error}
              </div>
            )}

            {searchQuery.trim() ? (
              isConversationUsersLoading || isCreating ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted small">
                  <span className="spinner-border spinner-border-sm mb-2" role="status" />
                  Loading users...
                </div>
              ) : conversationUsersResponse?.data && conversationUsersResponse.data.length > 0 ? (
                <div className="list-group list-group-flush px-1">
                  {conversationUsersResponse.data.map((user: User) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="list-group-item list-group-item-action d-flex align-items-center gap-3 border-0 px-3 py-2 rounded-3 cursor-pointer mb-1"
                      style={{ cursor: "pointer" }}
                    >
                      <UserAvatar name={user.name} imageUrl={user.profilePicture} size="md" />
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: "0.85rem" }}>
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
                        width="14"
                        height="14"
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
                  <span className="fs-4 mb-1">🔍</span>
                  <h6 className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>
                    No users found
                  </h6>
                  <p className="small mb-0" style={{ fontSize: "0.75rem" }}>
                    Try a different name or phone number
                  </p>
                </div>
              )
            ) : isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </>
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((conversation) => (
                <ConversationItem key={conversation._id} conversation={conversation} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </>
      )}

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />
    </aside>
  );
};

export default ChatSidebar;
