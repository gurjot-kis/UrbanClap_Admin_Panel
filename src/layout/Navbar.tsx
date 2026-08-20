import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuMenu } from 'react-icons/lu';
import { useLayout } from './LayoutContext';

export default function Navbar(): React.ReactElement {
  const navigate = useNavigate();
  const { headerConfig, setIsSidebarOpen } = useLayout();

  return (
    <header className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3 bg-white border-bottom border-light sticky-top shadow-xs">
      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="btn btn-light d-lg-none d-flex align-items-center justify-content-center p-2 rounded-3 border"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <LuMenu size={20} className="text-secondary" />
        </button>

        {headerConfig.backTo && (
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center p-2 rounded-3"
            onClick={() => navigate(headerConfig.backTo!)}
            title={headerConfig.backTitle || 'Back'}
          >
            <LuArrowLeft size={18} />
          </button>
        )}
        
        <div>
          <h5 className="mb-0 fw-bold text-dark">{headerConfig.title || 'Dashboard'}</h5>
          {headerConfig.subtitle && (
            <small className="text-muted d-block" style={{ fontSize: '0.8rem', marginTop: '-2px' }}>
              {headerConfig.subtitle}
            </small>
          )}
        </div>
      </div>
    </header>
  );
}
