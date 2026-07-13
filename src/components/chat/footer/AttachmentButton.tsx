
interface AttachmentButtonProps {
  isOpen: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function AttachmentButton({
  isOpen,
  onClick,
  disabled = false,
}: AttachmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn btn-link btn-sm p-1 text-secondary rounded-circle d-flex align-items-center justify-content-center"
      style={{
        width: "36px",
        height: "36px",
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label="Attach file"
    >
      <svg
        className={`transition-transform ${isOpen ? "rotate-45" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        style={{ transition: "transform 0.2s" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
    </button>
  );
}
