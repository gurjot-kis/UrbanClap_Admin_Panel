import ChatSidebar from "./sidebar/ChatSidebar";
import ChatHeader from "./header/ChatHeader";
import ChatBody from "./body/ChatBody";
import ChatFooter from "./footer/ChatFooter";
import { useAppSelector } from "../../store/hooks";
import "./chatLayout.css";

const ChatLayout = () => {
  const selectedConversation = useAppSelector(
    (state) => state.chat.selectedConversation,
  );

  const pendingFiles = useAppSelector((state) => state.chat.pendingFiles);

  return (
    <div
      className="d-flex w-100 overflow-hidden bg-light border rounded-3 shadow-sm"
      style={{ height: "calc(100vh - 85px)" }}
    >
      {/* Sidebar container */}
      <div
        className={`chat-sidebar-wrapper ${selectedConversation ? "d-none d-md-flex" : "d-flex"} h-100 flex-shrink-0`}
        style={{ width: "100%" }}
      >
        <ChatSidebar />
      </div>

      {/* Main chat window container */}
      <div
        className={`${!selectedConversation ? "d-none d-md-flex" : "d-flex"} flex-grow-1 h-100 bg-white`}
      >
        {!selectedConversation ? (
          <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light bg-opacity-50">
            <div className="text-center p-4" style={{ maxWidth: "340px" }}>
              <div
                className="d-flex align-items-center justify-content-center mx-auto mb-4 bg-primary bg-opacity-10 text-primary rounded-4"
                style={{ width: "72px", height: "72px" }}
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="36"
                  height="36"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h5 className="fw-bold mb-2">Real-Time Chat App</h5>
              <p className="text-muted small mb-0">
                Select a conversation from the sidebar or click "Start New Chat"
                to begin messaging instantly.
              </p>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column w-100 h-100 position-relative overflow-hidden">
            <ChatHeader />
            <ChatBody />
            {pendingFiles.length === 0 && <ChatFooter disabled={selectedConversation.isEnded} />}{" "}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
