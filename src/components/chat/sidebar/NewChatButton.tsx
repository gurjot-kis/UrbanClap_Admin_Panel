import React from "react";

interface NewChatButtonProps {
  onClick?: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="btn btn-primary d-flex align-items-center justify-content-center gap-2 w-100 py-2 rounded-pill font-weight-bold"
      style={{
        backgroundColor: "#1b3a5c",
        borderColor: "#1b3a5c",
        fontSize: "0.88rem",
        fontWeight: 600,
      }}
    >
      <span
        className="d-flex align-items-center justify-content-center rounded-circle text-white bg-white bg-opacity-25"
        style={{ width: "20px", height: "20px" }}
      >
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          viewBox="0 0 24 24"
          width="12"
          height="12"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </span>
      Start New Chat
    </button>
  );
};

export default NewChatButton;
