
const ChatSkeleton = () => {
  return (
    <div
      className="d-flex w-100 p-3 align-items-center placeholder-glow"
      style={{ gap: "1rem" }}
    >
      {/* Avatar Skeleton */}
      <div
        className="placeholder rounded-circle flex-shrink-0"
        style={{ width: "42px", height: "42px" }}
      ></div>

      {/* Text Lines Skeleton */}
      <div className="flex-grow-1 d-flex flex-column gap-2">
        <div className="d-flex justify-content-between align-items-center">
          <span
            className="placeholder rounded col-4"
            style={{ height: "14px" }}
          ></span>
          <span
            className="placeholder rounded col-2"
            style={{ height: "10px" }}
          ></span>
        </div>
        <span
          className="placeholder rounded col-8"
          style={{ height: "10px" }}
        ></span>
      </div>
    </div>
  );
};

export default ChatSkeleton;
