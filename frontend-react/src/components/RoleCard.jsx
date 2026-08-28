// RoleCard displays a single user role.
// Receives: name, description, accentColor via props.
function RoleCard({ name, description, accentColor }) {
  return (
    <li
      className="role-item"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <strong className="role-name" style={{ color: accentColor }}>
        {name}
      </strong>
      <span className="role-desc">{description}</span>
    </li>
  );
}

export default RoleCard;
