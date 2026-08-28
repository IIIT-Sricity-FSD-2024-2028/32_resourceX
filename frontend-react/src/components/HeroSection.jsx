import heroDashboard from "../assets/images/hero_dashboard_v2.png";

// HeroSection receives content via props from App (PROP pattern).
// onExploreClick is a CALLBACK – child notifies parent when user clicks "Explore Features".
function HeroSection({ tag, title, titleHighlight, subtitle, onExploreClick }) {
  return (
    <section id="dashboard" className="hero-section">
      <div className="hero-content">
        <div className="hero-tag">{tag}</div>
        <h1 className="hero-title">
          {title} <span>{titleHighlight}</span> with ResourceX
        </h1>
        <p className="hero-subtitle">{subtitle}</p>
        <div className="hero-actions">
          <button className="custom-explore-btn" onClick={onExploreClick}>
            Explore Features
          </button>
        </div>
      </div>

      <div className="hero-visual">
        <img src={heroDashboard} alt="ResourceX Enterprise Dashboard" />
      </div>
    </section>
  );
}

export default HeroSection;
