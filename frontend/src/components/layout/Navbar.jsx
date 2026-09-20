import React from 'react';
import { IconSearch, IconMenu } from '../common/Icons';

export const Navbar = ({ onToggleMobileSidebar }) => {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-nav-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <IconMenu />
        </button>

        <div className="header-title-badge">
          <div className="header-pulse" />
          <span>Task 07 • Smart Data Management</span>
        </div>
      </div>

      <div className="header-right">
        {/* Search bar */}
        <div className="header-search">
          <span className="header-search-icon">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search projects, tasks, materials..."
          />
        </div>

        {/* User Profile */}
        <div className="header-user-profile">
          <div className="user-avatar">PM</div>
          <div className="user-info">
            <span className="user-name">Project Director</span>
            <span className="user-role">Operations & Planning</span>
          </div>
        </div>
      </div>
    </header>
  );
};
