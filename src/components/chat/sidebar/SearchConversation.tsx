import React from "react";

interface SearchConversationProps {
  value: string;
  onChange: (val: string) => void;
}

const SearchConversation: React.FC<SearchConversationProps> = ({ value, onChange }) => {
  return (
    <div className="position-relative">
      <div
        className="position-absolute top-50 start-0 translate-middle-y ps-3 pointer-events-none d-flex align-items-center"
        style={{ pointerEvents: "none" }}
      >
        <svg
          className="text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-control rounded-pill bg-light border-0 small"
        placeholder="Search chats..."
        style={{ paddingLeft: "2.5rem", fontSize: "0.85rem" }}
      />
    </div>
  );
};

export default SearchConversation;
