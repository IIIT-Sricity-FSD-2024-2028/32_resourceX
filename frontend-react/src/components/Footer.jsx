// Footer receives footerLinks array via props from App.
function Footer({ footerLinks }) {
  return (
    <footer className="landing-footer">
      <div className="footer-brand">
        <strong>ResourceX</strong>
        <br />© 2024 ResourceX Enterprise. All rights reserved.
      </div>
      <div className="footer-links">
        {footerLinks.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}

export default Footer;
