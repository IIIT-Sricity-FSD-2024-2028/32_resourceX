import React from "react";
import FeatureCard from "./FeatureCard";

/**
 * DepartmentsSection Component
 * Props: heading, subheading, cards (array)
 */
export default function DepartmentsSection({ heading, subheading, cards }) {
  return (
    <section id="departments" className="content-section">
      <div className="section-header">
        <h2>{heading}</h2>
        <p>{subheading}</p>
      </div>
      <div className="features-grid">
        {cards.map((card) => (
          <FeatureCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            description={card.description}
            iconColor={card.iconColor}
          />
        ))}
      </div>
    </section>
  );
}
