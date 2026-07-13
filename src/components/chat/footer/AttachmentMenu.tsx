import React, { useRef, useEffect } from "react";

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: FileList, type: "document" | "media") => void;
}

const AttachmentMenu = ({
  isOpen,
  onClose,
  onFileSelect,
}: AttachmentMenuProps) => {
  const documentInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const triggerBtn = document.querySelector('[aria-label="Attach file"]');
      if (triggerBtn && triggerBtn.contains(event.target as Node)) {
        return;
      }

      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "document" | "media"
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files, type);
    }
    e.target.value = "";
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="position-absolute bg-white rounded-3 shadow border border-light p-2"
      style={{
        bottom: "45px",
        left: "40px",
        width: "220px",
        zIndex: 1000,
      }}
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={documentInputRef}
        className="d-none"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
        multiple
        onChange={(e) => handleFileChange(e, "document")}
      />
      <input
        type="file"
        ref={mediaInputRef}
        className="d-none"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFileChange(e, "media")}
      />

      <div className="d-flex flex-column gap-1">
        {/* Document Button */}
        <button
          onClick={() => documentInputRef.current?.click()}
          className="btn btn-link btn-sm d-flex align-items-center text-decoration-none px-2 py-2 text-start text-dark hover-bg-light rounded-3"
          style={{ transition: "background-color 0.2s" }}
        >
          <div
            className="d-flex align-items-center justify-content-center text-white rounded-circle flex-shrink-0 me-3"
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <div className="fw-bold mb-0 text-dark" style={{ fontSize: "0.85rem" }}>
              Document
            </div>
            <div className="text-muted small" style={{ fontSize: "10px" }}>
              PDF, DOC, TXT
            </div>
          </div>
        </button>

        {/* Photos & Videos Button */}
        <button
          onClick={() => mediaInputRef.current?.click()}
          className="btn btn-link btn-sm d-flex align-items-center text-decoration-none px-2 py-2 text-start text-dark hover-bg-light rounded-3"
          style={{ transition: "background-color 0.2s" }}
        >
          <div
            className="d-flex align-items-center justify-content-center text-white rounded-circle flex-shrink-0 me-3"
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #10b981, #059669)",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <div className="fw-bold mb-0 text-dark" style={{ fontSize: "0.85rem" }}>
              Photos & Videos
            </div>
            <div className="text-muted small" style={{ fontSize: "10px" }}>
              Images, Videos
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AttachmentMenu;
