import FeatureCard from "./FeatureCard";

// ResourcesSection receives heading, subheading, and cards array via props from App.
function ResourcesSection({ heading, subheading, cards }) {
  return (
    <section id="resources" className="content-section">
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

export default ResourcesSection;
