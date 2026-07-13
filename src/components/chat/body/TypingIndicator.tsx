
const TypingIndicator = () => {
  return (
    <div className="d-flex w-100 mb-3 justify-content-start">
      <div className="typing-indicator-bubble border border-light shadow-sm">
        <div className="d-flex align-items-center gap-1.5" style={{ gap: "6px" }}>
          <div className="typing-dot" style={{ animationDelay: "0ms" }}></div>
          <div className="typing-dot" style={{ animationDelay: "150ms" }}></div>
          <div className="typing-dot" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
