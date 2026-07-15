import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../../utils/auth";
import ChatLayout from "../../components/chat/ChatLayout";
import { VENDOR_ROUTES } from "../../routes";
import { connectSocket, disconnectSocket } from "../../services/socket";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  setOnlineUsers,
  addUserOnline,
  removeUserOffline,
  addMessage,
  setUserTyping,
  setUserStopTyping,
  markMessagesAsRead,
  setSelectedConversation,
  setMessages,
  removeConversation,
  clearMessages,
} from "../../features/chat/chatSlice";
import type { Message } from "../../features/chat/chatTypes";
import { chatApi, useLazyGetMessagesQuery } from "../../features/chat/chatApi";
import VendorLayout from "../../components/vendor/VendorLayout";
import "../../styles/Chat.css";

function VendorSupportPage() {
  const dispatch = useAppDispatch();
  const vendorToken = getStoredToken();
  const vendorUser = getStoredUser();

  const [getMessages] = useLazyGetMessagesQuery();

  const selectedConversation = useAppSelector(
    (state) => state.chat.selectedConversation,
  );
  const selectedConversationRef = useRef(selectedConversation);
  const user = useAppSelector((state) => state.auth.user);
  const userRef = useRef(user);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  if (!vendorToken || !vendorUser) {
    return <Navigate to={VENDOR_ROUTES.dashboard} replace />;
  }

  useEffect(() => {
    if (!vendorToken) return;

    const socket = connectSocket(vendorToken);

    if (socket) {
      socket.on("get_online_users", (userIds: string[]) => {
        dispatch(setOnlineUsers(userIds));
      });

      socket.on("user_online", (data: { userId: string }) => {
        dispatch(addUserOnline(data.userId));
      });

      socket.on("user_offline", (data: { userId: string }) => {
        dispatch(removeUserOffline(data.userId));
      });

      socket.on(
        "new_message",
        (response: { conversationId: string; message: Message }) => {
          if (!response?.message) return;

          const currentSelected = selectedConversationRef.current;

          dispatch(addMessage(response.message));

          dispatch(
            chatApi.util.updateQueryData(
              "getConversations",
              undefined,
              (draft) => {
                const conv = draft.data.find(
                  (c) => c._id === response.conversationId,
                );
                if (conv) {
                  conv.lastMessage = {
                    _id: response.message._id,
                    conversation: response.message.conversation,
                    sender: response.message.sender._id,
                    messageType: response.message.messageType,
                    text: response.message.text,
                    mediaUrl: response.message.mediaUrl,
                    readBy: response.message.readBy,
                    deliveredTo: response.message.deliveredTo,
                    createdAt: response.message.createdAt,
                    updatedAt: response.message.updatedAt,
                  };

                  const senderId =
                    typeof response.message.sender === "object"
                      ? response.message.sender._id
                      : response.message.sender;
                  const currentUser = userRef.current;

                  if (
                    senderId !== currentUser?._id &&
                    (!currentSelected ||
                      response.conversationId !== currentSelected._id)
                  ) {
                    conv.unreadCount = (conv.unreadCount || 0) + 1;
                  }

                  const index = draft.data.indexOf(conv);
                  if (index > -1) {
                    draft.data.splice(index, 1);
                    draft.data.unshift(conv);
                  }
                } else {
                  dispatch(chatApi.util.invalidateTags(["Conversation"]));
                }
              },
            ),
          );
        },
      );

      socket.on(
        "messages_read",
        (data: { conversationId: string; userId: string }) => {
          const currentUser = userRef.current;
          dispatch(
            chatApi.util.updateQueryData(
              "getConversations",
              undefined,
              (draft) => {
                const conv = draft.data.find(
                  (c) => c._id === data.conversationId,
                );
                if (conv) {
                  if (data.userId === currentUser?._id) {
                    conv.unreadCount = 0;
                  }

                  if (conv.lastMessage) {
                    const alreadyRead = conv.lastMessage.readBy.some(
                      (r: any) => {
                        const readerId = typeof r === "string" ? r : r.user;
                        return readerId === data.userId;
                      },
                    );

                    if (!alreadyRead) {
                      conv.lastMessage.readBy.push({
                        user: data.userId,
                        readAt: new Date().toISOString(),
                      });
                    }
                  }
                }
              },
            ),
          );

          dispatch(markMessagesAsRead(data));
        },
      );

      socket.on(
        "user_typing",
        (data: {
          conversationId: string;
          userId: string;
          userName: string;
        }) => {
          dispatch(setUserTyping(data));
        },
      );

      socket.on(
        "user_stop_typing",
        (data: { conversationId: string; userId: string }) => {
          dispatch(setUserStopTyping(data));
        },
      );

      socket.on(
        "end_chat",
        async (data: { conversationId: string; end_chat: boolean }) => {
          dispatch(
            chatApi.util.updateQueryData(
              "getConversations",
              undefined,
              (draft) => {
                const conv = draft.data.find(
                  (c) => c._id === data.conversationId,
                );
                if (conv) {
                  conv.isEnded = true;
                }
              },
            ),
          );

          const currentSelected = selectedConversationRef.current;
          if (currentSelected && currentSelected._id === data.conversationId) {
            dispatch(
              setSelectedConversation({
                ...currentSelected,
                isEnded: true,
              }),
            );

            // Reload messages when chat is ended
            try {
              const response = await getMessages({
                conversationId: data.conversationId,
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
              console.error("Failed to reload messages after end chat:", error);
            }
          }
        },
      );

      socket.on(
        "conversation_rated",
        (_data: { conversationId: string; rating: number; feedback?: string }) => {
          dispatch(chatApi.util.invalidateTags(["Conversation"]));
        },
      );

      socket.on(
        "conversation_removed",
        (data: { conversationId: string; reason?: string }) => {
          const currentSelected = selectedConversationRef.current;

          dispatch(
            chatApi.util.updateQueryData(
              "getConversations",
              undefined,
              (draft) => {
                const index = draft.data.findIndex(
                  (c) => c._id === data.conversationId
                );
                if (index > -1) {
                  draft.data.splice(index, 1);
                }
              }
            ),
          );

          if (currentSelected && currentSelected._id === data.conversationId) {
            dispatch(removeConversation(data.conversationId));
            dispatch(clearMessages());
            localStorage.removeItem("activeConversationId");
          }
        },
      );
    }

    return () => {
      if (socket) {
        socket.off("get_online_users");
        socket.off("user_online");
        socket.off("user_offline");
        socket.off("new_message");
        socket.off("messages_read");
        socket.off("user_typing");
        socket.off("user_stop_typing");
        socket.off("end_chat");
        socket.off("conversation_rated");
        socket.off("conversation_removed");
      }
      disconnectSocket();
    };
  }, [vendorToken, dispatch, getMessages]);

  return (
    <VendorLayout title="Support">
      <ChatLayout />
    </VendorLayout>
  );
}

export default VendorSupportPage;
