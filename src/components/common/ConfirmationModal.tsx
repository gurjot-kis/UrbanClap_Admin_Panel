import React, { useEffect } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import "../../styles/ConfirmationModal.css";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "primary";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "yes, Delete",
  cancelText = "Cancel",
  isLoading = false,
  variant = "danger",
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="pm-backdrop" onClick={!isLoading ? onClose : undefined}>
      <div
        className="pm-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="pm-close-btn"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close modal"
        >
          <IoClose size={20} />
        </button>

        <div className="pm-content">
          <div className={`pm-icon-wrapper pm-icon--${variant}`}>
            <FiAlertTriangle size={24} />
          </div>

          <h3 className="pm-title">{title}</h3>
          <p className="pm-message">{message}</p>
        </div>

        <div className="pm-actions">
          <button
            type="button"
            className="pm-btn pm-btn--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`pm-btn pm-btn--${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="pm-loader">
                <span className="pm-spinner" /> Deleting...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};