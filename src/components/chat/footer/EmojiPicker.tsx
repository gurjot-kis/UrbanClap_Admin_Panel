import { useState, useEffect, useRef } from "react";
import { BsEmojiSmile, BsEmojiSmileFill } from "react-icons/bs";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = [
  {
    title: "Smileys & Emotion",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
      "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸",
      "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
      "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
      "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
    ],
  },
  {
    title: "Hands & Gestures",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
      "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
      "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "🙏",
    ],
  },
  {
    title: "Hearts & Expressions",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💥", "💫", "✨", "💯", "💢", "💬", "👁️", "🧠", "💅", "🔥",
    ],
  },
  {
    title: "Animals & Nature",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅",
      "🐝", "🦋", "🐌", "🐞", "🐜", "🕷️", "🐢", "🐍", "🐙", "🐬",
      "🍀", "🌸", "🌹", "🌻", "🍂", "🍁", "🌲", "🌴", "🌵", "🌾",
    ],
  },
];

export default function EmojiPicker({ onSelectEmoji, disabled = false }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
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

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    const categoryEl = containerRef.current?.querySelector(`#emoji-category-${index}`);
    if (categoryEl) {
      categoryEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          className="position-absolute bg-white rounded-3 shadow border border-light d-flex flex-column"
          style={{
            bottom: "45px",
            left: 0,
            width: "300px",
            height: "350px",
            zIndex: 1000,
          }}
        >
          {/* Header Categories */}
          <div className="d-flex border-bottom border-light bg-light px-2 py-1 flex-shrink-0 overflow-auto">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.title}
                type="button"
                onClick={() => handleCategoryClick(idx)}
                className={`btn btn-link btn-sm flex-grow-1 text-center py-1 px-1.5 border-0 ${
                  activeCategory === idx ? "bg-white fw-bold rounded-2 text-primary" : "text-secondary"
                }`}
                style={{ fontSize: "13px", minWidth: "40px" }}
              >
                {cat.emojis[0]}
              </button>
            ))}
          </div>

          {/* Emoji Lists (Scrollable) */}
          <div className="flex-grow-1 overflow-auto p-3">
            {EMOJI_CATEGORIES.map((category, catIdx) => (
              <div key={category.title} id={`emoji-category-${catIdx}`} className="mb-3">
                <div
                  className="fw-bold text-muted text-uppercase mb-2"
                  style={{ fontSize: "10px", letterSpacing: "0.05em" }}
                >
                  {category.title}
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onSelectEmoji(emoji)}
                      className="btn btn-link btn-sm p-0 d-flex align-items-center justify-content-center hover-bg-light"
                      style={{
                        fontSize: "1.4rem",
                        width: "32px",
                        height: "32px",
                        lineHeight: 1,
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
