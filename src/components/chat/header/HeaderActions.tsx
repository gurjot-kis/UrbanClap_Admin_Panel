
const HeaderActions = () => {
  return (
    <div className="d-flex align-items-center gap-1">
      {/* Audio Call Button */}
      <button
        className="btn btn-link btn-sm text-secondary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: "36px", height: "36px", padding: 0 }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      </button>

      {/* Video Call Button */}
      <button
        className="btn btn-link btn-sm text-secondary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: "36px", height: "36px", padding: 0 }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Divider */}
      <div
        className="vr mx-2 bg-secondary opacity-25 d-none d-sm-block"
        style={{ height: "20px" }}
      ></div>

      {/* More Options Button */}
      <button
        className="btn btn-link btn-sm text-secondary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: "36px", height: "36px", padding: 0 }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>
  );
};

export default HeaderActions;
