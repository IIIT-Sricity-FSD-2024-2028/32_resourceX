// PartnersSection receives the list of partner names via props from App.
function PartnersSection({ title, partners }) {
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

export default PartnersSection;
