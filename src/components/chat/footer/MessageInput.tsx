import React, { useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<Props> = ({
  value,
  onChange,
  onKeyDown,
  onPaste,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const newHeight = Math.min(Math.max(textarea.scrollHeight, 38), 160);
    textarea.style.height = `${newHeight}px`;

    if (textarea.scrollHeight > 160) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  }, [value]);

  return (
    <div className="flex-grow-1 mx-2 min-w-0 d-flex align-items-center">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        disabled={disabled}
        placeholder={placeholder}
        className="form-control rounded-4 bg-light border-0 py-2 px-3 small resize-none"
        style={{
          height: "38px",
          overflowY: "hidden",
          resize: "none",
          fontSize: "0.88rem",
        }}
      />
    </div>
  );
};

export default MessageInput;
