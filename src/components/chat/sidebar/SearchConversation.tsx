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
        style={{ pointerEvents: "none", zIndex: 2 }}
      >
        <svg
          className="text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="18"
          height="18"
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
        className="form-control rounded-pill border bg-light"
        placeholder="Search conversations..."
        style={{
          paddingLeft: "2.75rem",
          paddingTop: "0.65rem",
          paddingBottom: "0.65rem",
          fontSize: "0.9rem",
          minHeight: "44px",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      />
    </div>
  );
};

export default SearchConversation;
