import React from "react";

/**
 * PartnersSection displays enterprise logos/names
 * Props: title, partners (array)
 */
export default function PartnersSection({ title, partners }) {
  return (
    <section className="partners-section">
      <div className="partners-title">{title}</div>
      <div className="partners-grid">
        {partners.map((name) => (
          <div key={name} className="partner-box">
            {name}
          </div>
        ))}
      </div>
    </section>
  );
}
