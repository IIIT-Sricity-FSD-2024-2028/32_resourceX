// Navbar component
// Receives: navLinks (array), activeSection (string), onNavClick (callback to parent)
// The activeSection highlight is LIFTED STATE – managed in App and passed down via props.
// onNavClick is the CALLBACK – child tells parent which section was clicked.

function Navbar({ navLinks, activeSection, onNavClick }) {
  return (
    <nav className="landing-nav">
      <div className="logo-container">
        <div className="logo-icon">R</div>
        <div className="logo-text">ResourceX</div>
      </div>

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

      <div className="landing-actions">
        <a href="../frontend/pages/login.html" className="custom-signin-btn">
          Sign In
        </a>
      </div>
    </nav>
  );
}

export default Navbar;
