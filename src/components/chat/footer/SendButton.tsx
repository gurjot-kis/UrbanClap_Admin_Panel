import React from "react";
import { IoSend } from "react-icons/io5";

interface SendButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({
  disabled = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn rounded-circle d-flex align-items-center justify-content-center border-0`}
      style={{
        width: "36px",
        height: "36px",
        backgroundColor: disabled ? "#cbd5e1" : "#1b3a5c",
        color: "#ffffff",
        opacity: disabled ? 0.6 : 1,
        transition: "transform 0.15s, opacity 0.15s",
      }}
    >
      <IoSend size={16} />
    </button>
  );
};

export default SendButton;
