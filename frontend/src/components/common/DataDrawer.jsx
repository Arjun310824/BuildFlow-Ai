import React, { useEffect } from 'react';
import { IconX } from './Icons';

/**
 * DataDrawer: High-end slide-out contextual inspection drawer.
 * Prevents disruptive page transitions when inspecting details for tasks, materials, or site stages.
 */
export const DataDrawer = ({
  isOpen,
  onClose,
  title = 'Telemetry Detail',
  subtitle = '',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="data-drawer-backdrop" onClick={onClose}>
      <div className="data-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="data-drawer-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
            {subtitle && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            title="Close Drawer (Esc)"
            aria-label="Close Drawer"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="data-drawer-body">
          {children}
        </div>
      </div>
    </div>
  );
};
