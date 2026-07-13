
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content border-0 rounded-4 shadow-lg">
          <div className="modal-body p-4 text-center">
            {/* Red Trash Icon */}
            <div
              className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-3"
              style={{ width: "48px", height: "48px" }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            <h5 className="modal-title fw-bold mb-2">Delete Conversation</h5>
            <p className="text-muted small mb-4">
              Are you sure you want to delete your conversation with{" "}
              <span className="fw-bold text-dark">{title}</span> from your sidebar?
            </p>

            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-light rounded-pill btn-sm px-4"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger rounded-pill btn-sm px-4 d-flex align-items-center gap-1"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <span className="spinner-border spinner-border-sm" role="status" />
                )}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
