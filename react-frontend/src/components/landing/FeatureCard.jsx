import React from "react";

/**
 * FeatureCard is a reusable card component.
 * Props: icon (Material Symbol name), title, description, iconColor
 */
export default function FeatureCard({ icon, title, description, iconColor }) {
  return (
    <div className="feature-card">
      <div
        className="material-symbols-outlined"
        style={{ fontSize: "2.75rem", color: iconColor || "var(--primary-color)", marginBottom: "1rem" }}
      >
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}
