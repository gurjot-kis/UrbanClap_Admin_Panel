import { useRef, useState, useEffect, useLayoutEffect } from "react";
import type { ReactNode, RefObject } from "react";
import { MdKeyboardDoubleArrowDown } from "react-icons/md";
import "./InfiniteScrollContainer.css";

interface InfiniteScrollContainerProps {
  children: ReactNode;
  onScrollTop: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  messages: any[];
  conversationId?: string;
  unreadCount: number;
  hasUnreads: boolean;
  onMarkAsRead: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  loggedInUserId?: string;
}

export default function InfiniteScrollContainer({
  children,
  onScrollTop,
  hasMore,
  isLoadingMore,
  messages,
  conversationId,
  unreadCount,
  hasUnreads,
  onMarkAsRead,
  scrollRef,
  loggedInUserId,
}: InfiniteScrollContainerProps) {
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [floatingDate, setFloatingDate] = useState<string>("");
  const [showFloatingDate, setShowFloatingDate] = useState<boolean>(false);

  const scrollHeightBeforeRef = useRef<number>(0);
  const scrollTopBeforeRef = useRef<number>(0);
  const hasInitialScrolledRef = useRef<boolean>(false);
  const prevLastMsgIdRef = useRef<string | null>(null);
  const isFetchingOlderRef = useRef<boolean>(false);

  const floatingDateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (floatingDateTimeoutRef.current) {
        clearTimeout(floatingDateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    hasInitialScrolledRef.current = false;
    setShowScrollArrow(false);
    prevLastMsgIdRef.current = null;
    isFetchingOlderRef.current = false;
    setFloatingDate("");
    setShowFloatingDate(false);
    if (floatingDateTimeoutRef.current) {
      clearTimeout(floatingDateTimeoutRef.current);
      floatingDateTimeoutRef.current = null;
    }
  }, [conversationId]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const lastMessage = messages[messages.length - 1];
    const currentLastMsgId = lastMessage?._id || null;
    const isNewMessageAppend =
      prevLastMsgIdRef.current !== null &&
      currentLastMsgId !== null &&
      currentLastMsgId !== prevLastMsgIdRef.current;

    prevLastMsgIdRef.current = currentLastMsgId;

    if (isFetchingOlderRef.current) {
      const heightDifference =
        container.scrollHeight - scrollHeightBeforeRef.current;
      container.scrollTop = scrollTopBeforeRef.current + heightDifference;
    } else {
      const isMessagesForCurrentConversation =
        messages.length > 0 && messages[0].conversation === conversationId;

      if (!hasInitialScrolledRef.current && isMessagesForCurrentConversation) {
        container.scrollTop = container.scrollHeight;
        hasInitialScrolledRef.current = true;
      } else if (isNewMessageAppend) {
        const lastMessageSenderId =
          typeof lastMessage?.sender === "object"
            ? lastMessage.sender?._id
            : lastMessage?.sender;
        const isOwn = lastMessageSenderId === loggedInUserId;

        if (isOwn) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        } else {
          const isNearBottom =
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            200;
          if (isNearBottom) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }
    }
  }, [messages, conversationId, loggedInUserId]);

  const handleScroll = async () => {
    const container = scrollRef.current;
    if (!container) return;

    if (
      container.scrollTop <= 5 &&
      hasMore &&
      !isLoadingMore &&
      !isFetchingOlderRef.current
    ) {
      isFetchingOlderRef.current = true;
      scrollHeightBeforeRef.current = container.scrollHeight;
      scrollTopBeforeRef.current = container.scrollTop;
      try {
        await onScrollTop();
      } finally {
        isFetchingOlderRef.current = false;
      }
    }

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      200;
    const shouldShow = !isNearBottom;
    setShowScrollArrow((prev) => (prev !== shouldShow ? shouldShow : prev));

    if (
      isNearBottom &&
      document.hasFocus() &&
      (hasUnreads || unreadCount > 0)
    ) {
      onMarkAsRead();
    }

    const dividers = container.querySelectorAll(".date-divider-element");
    let currentActiveDate = "";
    const containerTop = container.getBoundingClientRect().top;

    if (dividers.length > 0) {
      currentActiveDate = dividers[0].getAttribute("data-date") || "";

      dividers.forEach((divider) => {
        const rect = divider.getBoundingClientRect();
        if (rect.top <= containerTop + 40) {
          currentActiveDate = divider.getAttribute("data-date") || "";
        }
      });
    }

    if (currentActiveDate) {
      setFloatingDate(currentActiveDate);
      setShowFloatingDate(true);

      if (floatingDateTimeoutRef.current) {
        clearTimeout(floatingDateTimeoutRef.current);
      }

      floatingDateTimeoutRef.current = setTimeout(() => {
        setShowFloatingDate(false);
      }, 1500);
    }
  };

  const scrollToBottom = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
    onMarkAsRead();
  };

  return (
    <div
      className="chat-scroll-bg bg-whatsapp-pattern position-relative flex-grow-1 min-vh-0 w-100 d-flex flex-column"
      style={{ overflow: "hidden", minHeight: 0 }}
    >
      {/* Floating Date Badge */}
      {floatingDate && (
        <div
          className={`floating-date-pill position-absolute top-0 start-50 mt-3 z-3 ${
            showFloatingDate ? "is-visible" : "is-hidden"
          }`}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="2"
              ry="2"
              strokeWidth={2.5}
            />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2.5} />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2.5} />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2.5} />
          </svg>
          <span>{floatingDate}</span>
        </div>
      )}

      {/* Floating Loading overlay */}
      {isLoadingMore && (
        <div className="loading-older-pill position-absolute top-0 start-50 translate-middle-x mt-3 z-3">
          <div className="d-flex align-items-center gap-1">
            <span className="bounce-dot"></span>
            <span className="bounce-dot"></span>
            <span className="bounce-dot"></span>
          </div>
          <span className="loading-older-label">Loading...</span>
        </div>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-100 h-100 px-4 py-3 flex-grow-1"
        style={{ overflowY: "auto", minHeight: 0 }}
      >
        <div className="d-flex flex-column justify-content-end min-vh-100 pb-2">
          {children}
        </div>
      </div>

      {/* Scroll to Bottom Arrow Button */}
      {showScrollArrow && (
        <button
          onClick={scrollToBottom}
          className="scroll-to-bottom-btn position-absolute bottom-0 end-0 m-4 z-3"
          aria-label="Scroll to latest messages"
        >
          <MdKeyboardDoubleArrowDown size={22} />
          {unreadCount > 0 && (
            <span className="unread-badge-gradient">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
