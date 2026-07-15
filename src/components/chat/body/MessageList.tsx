import React, { useEffect } from "react";
import { useLazyGetMessagesQuery } from "../../../features/chat/chatApi";
import { setMessages } from "../../../features/chat/chatSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import MessageBubble from "./MessageBubble";
import DateDivider from "./DateDivider";

interface MessageListProps {
  unreadMarkerId?: string | null;
  unreadCount?: number;
}

const MessageList = ({ unreadMarkerId, unreadCount = 0 }: MessageListProps) => {
  const dispatch = useAppDispatch();
  const [getMessages] = useLazyGetMessagesQuery();

  const messages = useAppSelector((state) => state.chat.messages);
  const selectedConversation = useAppSelector(
    (state) => state.chat.selectedConversation,
  );
  const loggedInUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!selectedConversation || selectedConversation.isEnded) return;

    const loadMessages = async () => {
      try {
        const response = await getMessages({
          conversationId: selectedConversation._id,
          page: 1,
          limit: 30,
        }).unwrap();

        dispatch(
          setMessages({
            messages: response.data.messages,
            hasMore: response.data.hasMore,
            page: response.data.page,
          }),
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();
  }, [selectedConversation, getMessages, dispatch]);

  if (!selectedConversation) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
        Select a conversation
      </div>
    );
  }

  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();

    const dMidnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const nowMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const diffTime = nowMidnight.getTime() - dMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays > 1 && diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month} ${day} ${year}`;
    }
  };

  const renderMessages = () => {
    const elements: React.ReactNode[] = [];
    let lastDateLabel = "";

    const processedItems: any[] = [];
    let currentMediaGroup: any[] = [];

    const flushMediaGroup = () => {
      if (currentMediaGroup.length === 0) return;
      if (currentMediaGroup.length === 1) {
        processedItems.push(currentMediaGroup[0]);
      } else {
        const firstMsg = currentMediaGroup[0];
        processedItems.push({
          ...firstMsg,
          messageType: "media_group",
          mediaItems: currentMediaGroup.map((msg) => ({
            id: msg._id,
            mediaUrl: msg.mediaUrl,
            messageType: msg.messageType,
            text: msg.text,
          })),
        });
      }
      currentMediaGroup = [];
    };

    messages.forEach((message) => {
      const isMedia =
        message.messageType === "image" || message.messageType === "video";
      const lastMsgInGroup = currentMediaGroup[currentMediaGroup.length - 1];

      const canGroup =
        isMedia &&
        currentMediaGroup.length > 0 &&
        lastMsgInGroup.sender._id === message.sender._id &&
        formatDateLabel(lastMsgInGroup.createdAt) ===
          formatDateLabel(message.createdAt) &&
        Math.abs(
          new Date(message.createdAt).getTime() -
            new Date(lastMsgInGroup.createdAt).getTime(),
        ) <
          10 * 1000;

      if (isMedia) {
        if (canGroup) {
          currentMediaGroup.push(message);
        } else {
          flushMediaGroup();
          currentMediaGroup = [message];
        }
      } else {
        flushMediaGroup();
        processedItems.push(message);
      }
    });

    flushMediaGroup();

    processedItems.forEach((message) => {
      const dateLabel = formatDateLabel(message.createdAt);

      if (dateLabel !== lastDateLabel) {
        elements.push(
          <DateDivider key={`divider-${message._id}`} date={dateLabel} />,
        );
        lastDateLabel = dateLabel;
      }

      if (message._id === unreadMarkerId && unreadCount > 0) {
        elements.push(
          <div
            key={`unread-divider-${message._id}`}
            className="d-flex align-items-center justify-content-center my-3"
          >
            <div className="flex-grow-1 border-top border-danger border-opacity-25"></div>
            <span
              className="mx-3 px-3 py-1 bg-danger bg-opacity-10 text-danger rounded-pill border border-danger border-opacity-25"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              {unreadCount} Unread Message{unreadCount > 1 ? "s" : ""}
            </span>
            <div className="flex-grow-1 border-top border-danger border-opacity-25"></div>
          </div>,
        );
      }

      const getMessageStatus = (msg: typeof message) => {
        const isOwn = msg.sender._id === loggedInUser?._id;

        if (!isOwn) return undefined;

        const hasBeenRead =
          msg.readBy &&
          msg.readBy.some((r: any) => {
            const readerId = typeof r === "string" ? r : r.user;
            return readerId !== loggedInUser?._id;
          });

        if (hasBeenRead) return "seen";

        const hasBeenDelivered =
          msg.deliveredTo &&
          msg.deliveredTo.some((d: any) => {
            const receiverId = typeof d === "string" ? d : d.user;
            return receiverId !== loggedInUser?._id;
          });

        if (hasBeenDelivered) return "delivered";

        return "sent";
      };

      elements.push(
        <MessageBubble
          key={message._id}
          message={{
            id: message._id,
            text: message.text,
            time: new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isOwn: message.sender._id === loggedInUser?._id,
            status: getMessageStatus(message),
            messageType: message.messageType,
            mediaUrl: message.mediaUrl,
            senderAvatar: message.sender.avatar || "",
            senderName: message.sender.name,
            mediaItems: message.mediaItems,
            parentMessage: message.parentMessage
              ? {
                  _id: message.parentMessage._id,
                  text: message.parentMessage.text,
                  messageType: message.parentMessage.messageType,
                  senderName: message.parentMessage.sender?.name || "User",
                }
              : undefined,
          }}
        />,
      );
    });

    return elements;
  };

  return <div className="d-flex flex-column w-100">{renderMessages()}</div>;
};

export default MessageList;
