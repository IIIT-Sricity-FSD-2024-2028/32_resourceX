import React from "react";
import { Link } from "react-router-dom";
import heroDashboard from "../../assets/images/hero_dashboard_v2.png";
import { useAuth } from "../../context/AuthContext";

/**
 * HeroSection Component
 * Props: tag, title, titleHighlight, subtitle, onExploreClick
 */
export default function HeroSection({ tag, title, titleHighlight, subtitle, onExploreClick }) {
  const { user } = useAuth();

  return (
    <section id="dashboard" className="hero-section">
      <div className="hero-content">
        <div className="hero-tag">{tag}</div>
        <h1 className="hero-title">
          {title} <span>{titleHighlight}</span> with ResourceX
        </h1>
        <p className="hero-subtitle">{subtitle}</p>
        <div className="hero-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="custom-explore-btn" onClick={onExploreClick}>
            Explore Features
          </button>
          {user ? (
            <Link
              to="/dashboard"
              className="custom-signin-btn"
              style={{
                padding: '0.8rem 1.6rem',
                borderRadius: '30px',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Open Dashboard &rarr;
            </Link>
          ) : (
            <Link
              to="/login"
              className="custom-signin-btn"
              style={{
                padding: '0.8rem 1.6rem',
                borderRadius: '30px',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Sign In to Platform &rarr;
            </Link>
          )}
        </div>
      </div>

      <div className="hero-visual">
        <img
          src={heroDashboard}
          alt="ResourceX Enterprise Dashboard"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80';
          }}
        />
      </div>
    </section>
  );
}
