import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PastePreviewModalProps {
  files: File[];
  onClose: () => void;
  onSend: (caption: string) => void;
  isUploading: boolean;
}

const PastePreviewModal: React.FC<PastePreviewModalProps> = ({
  files,
  onClose,
  onSend,
  isUploading,
}) => {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setObjectUrls(urls);
    setActiveIndex(0);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isUploading) {
        onSend(caption);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!mounted || files.length === 0) return null;

  const currentFile = files[activeIndex];
  const currentUrl = objectUrls[activeIndex];

  const renderPreviewContent = () => {
    if (!currentFile || !currentUrl) return null;

    if (currentFile.type.startsWith("image/")) {
      return (
        <img
          src={currentUrl}
          alt={currentFile.name}
          className="img-fluid rounded shadow-sm border border-light object-fit-contain"
          style={{ maxHeight: "300px" }}
        />
      );
    }

    if (currentFile.type.startsWith("video/")) {
      return (
        <video
          src={currentUrl}
          controls
          className="rounded shadow-sm border border-light w-100"
          style={{ maxHeight: "300px" }}
        />
      );
    }

    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center p-4 bg-white border border-light rounded-4 shadow-sm text-center"
        style={{ maxWidth: "320px", width: "100%" }}
      >
        <span className="fs-1 mb-2">📄</span>
        <div className="w-100 min-w-0">
          <p className="fw-bold mb-0 text-truncate small">{currentFile.name}</p>
          <p className="text-muted small mt-1 mb-0" style={{ fontSize: "11px" }}>
            {(currentFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  };

  const modalMarkup = (
    <div
      className="modal show d-block"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content border-0 rounded-4 shadow-lg flex-column max-vh-90 overflow-hidden">
          {/* Header */}
          <div
            className="modal-header border-0 text-white rounded-top-4"
            style={{ background: "linear-gradient(135deg, #1b3a5c, #2a527d)" }}
          >
            <h5 className="modal-title fw-bold">
              Preview Send ({files.length} {files.length === 1 ? "file" : "files"})
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Cancel paste"
            ></button>
          </div>

          {/* Central Display */}
          <div
            className="modal-body p-4 bg-light d-flex flex-column align-items-center justify-content-center"
            style={{ minHeight: "260px", maxHeight: "350px", overflowY: "auto" }}
          >
            {renderPreviewContent()}
          </div>

          {/* Thumbnails (for multiple files) */}
          {files.length > 1 && (
            <div className="px-4 py-2 border-top border-light bg-light d-flex align-items-center justify-content-center gap-2 overflow-auto">
              {files.map((file, idx) => {
                const isSelected = idx === activeIndex;
                const url = objectUrls[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className="btn btn-link p-0 border-2 overflow-hidden flex-shrink-0"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "6px",
                      border: isSelected ? "2px solid #1b3a5c" : "2px solid #e2e8f0",
                      transform: isSelected ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.15s",
                    }}
                  >
                    {file.type.startsWith("image/") && url ? (
                      <img src={url} alt="" className="w-100 h-100 object-fit-cover" />
                    ) : file.type.startsWith("video/") ? (
                      <div className="w-100 h-100 bg-dark d-flex align-items-center justify-content-center text-white small">
                        📹
                      </div>
                    ) : (
                      <div className="w-100 h-100 bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center text-secondary small">
                        📄
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer input and buttons */}
          <div className="modal-footer border-0 p-3 bg-white d-flex align-items-center gap-2">
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              autoFocus
              className="form-control rounded-pill flex-grow-1 border-0 bg-light small"
              style={{ fontSize: "0.85rem" }}
            />
            <button
              onClick={() => onSend(caption)}
              disabled={isUploading}
              className="btn btn-primary rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: isUploading ? "#cbd5e1" : "#1b3a5c",
                borderColor: isUploading ? "#cbd5e1" : "#1b3a5c",
              }}
              aria-label="Send media"
            >
              {isUploading ? (
                <span className="spinner-border spinner-border-sm text-white" role="status" />
              ) : (
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16" style={{ marginLeft: "2px" }}>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
};

export default PastePreviewModal;
