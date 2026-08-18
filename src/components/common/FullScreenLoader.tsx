import React from "react";
import "../../styles/FullScreenLoader.css";

interface FullScreenLoaderProps {
  title?: string;
  subtitle?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  title = "Fetching Category Data",
  subtitle = "Preparing hierarchy and form configurations...",
}) => {
  return (
    <div className="fsl-overlay" role="status" aria-live="polite">
      <div className="fsl-container">
        {/* Animated ambient glow & rotating ring */}
        <div className="fsl-spinner-wrapper">
          <div className="fsl-pulse-glow" />
          <div className="fsl-spinner-ring" />
          <div className="fsl-spinner-core">
            <svg
              className="fsl-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>

        {/* Text Details */}
        <div className="fsl-text-block">
          <h3 className="fsl-title">{title}</h3>
          <p className="fsl-subtitle">{subtitle}</p>
        </div>

        {/* Shimmer Progress Track */}
        <div className="fsl-progress-track">
          <div className="fsl-progress-bar" />
        </div>
      </div>
    </div>
  );
};