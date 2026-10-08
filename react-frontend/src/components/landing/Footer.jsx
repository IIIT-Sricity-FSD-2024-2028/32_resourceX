import React from "react";
import { Link } from "react-router-dom";

/**
 * Footer Component
 * Props: footerLinks (array)
 */
export default function Footer({ footerLinks }) {
  return (
    <footer className="landing-footer">
      <div className="footer-brand">
        <strong>ResourceX</strong>
        <br />&copy; 2026 ResourceX Enterprise. All rights reserved.
      </div>
      <div className="footer-links">
        <Link to="/login" style={{ color: "var(--primary-color)", fontWeight: 600, marginRight: '1.5rem' }}>
          Platform Login
        </Link>
        {footerLinks.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
