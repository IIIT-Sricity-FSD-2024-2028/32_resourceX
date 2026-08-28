// FeatureCard is a reusable card component.
// Receives: icon (Material Symbol name), title, description, iconColor via props.
function FeatureCard({ icon, title, description, iconColor }) {
  return (
    <div className="feature-card">
      <div
        className="material-symbols-outlined"
        style={{ fontSize: "3rem", color: iconColor || "var(--primary-color)", marginBottom: "1rem" }}
      >
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}

export default FeatureCard;
