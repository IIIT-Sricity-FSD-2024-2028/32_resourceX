import React from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../services/auth";

/**
 * Landing Page Navbar Component
 * Props:
 *  - navLinks: array of section links
 *  - activeSection: current section id for scroll-spy highlight
 *  - onNavClick: callback when section link is clicked
 */
export default function Navbar({ navLinks, activeSection, onNavClick }) {
  const currentUser = getCurrentUser();

  return (
    <nav className="landing-nav">
      <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
        <div className="logo-icon">R</div>
        <div className="logo-text">ResourceX</div>
      </Link>

      <ul className="landing-nav-links">
        {navLinks.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              className={`nav-link${activeSection === link.id ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                onNavClick(link.id);
                document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="landing-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser ? (
          <>
            <Link
              to="/profile"
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted, #64748b)',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
              {currentUser.name?.split(' ')[0] || 'Profile'}
            </Link>
            <Link to="/dashboard" className="custom-signin-btn">
              Go to Dashboard &rarr;
            </Link>
          </>
        ) : (
          <Link to="/login" className="custom-signin-btn">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
