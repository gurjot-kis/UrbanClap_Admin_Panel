import { useState, useEffect, useRef } from "react";
import { BsEmojiSmile, BsEmojiSmileFill } from "react-icons/bs";
import Picker, { Theme } from "emoji-picker-react";

interface PremiumEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  disabled?: boolean;
}

export default function PremiumEmojiPicker({
  onSelectEmoji,
  disabled = false,
}: PremiumEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emojiData: any) => {
    onSelectEmoji(emojiData.emoji);
  };

  return (
    <div className="position-relative d-flex align-items-center" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-link btn-sm p-1 text-secondary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: "36px", height: "36px", opacity: disabled ? 0.5 : 1 }}
      >
        {isOpen ? (
          <BsEmojiSmileFill size={20} className="text-primary rotate-12" />
        ) : (
          <BsEmojiSmile size={20} className="text-secondary" />
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute shadow border border-light rounded-3 overflow-hidden bg-white"
          style={{ bottom: "45px", left: 0, zIndex: 1000 }}
        >
          <Picker
            onEmojiClick={handleEmojiClick}
            theme={Theme.LIGHT}
            autoFocusSearch={false}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{ showPreview: false }}
            height={320}
            width={280}
          />
        </div>
      )}
    </div>
  );
}
