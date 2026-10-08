import React from "react";
import RoleCard from "./RoleCard";

/**
 * UsersSection displays role capabilities
 * Props: heading, subheading, roles (array)
 */
export default function UsersSection({ heading, subheading, roles }) {
  return (
    <section
      id="users"
      className="content-section"
      style={{ backgroundColor: "#f8fafc", borderRadius: "20px" }}
    >
      <div className="section-header">
        <h2>{heading}</h2>
        <p>{subheading}</p>
      </div>

      <div className="users-layout">
        <div className="users-roles-col">
          <ul className="roles-list">
            {roles.map((role) => (
              <RoleCard
                key={role.name}
                name={role.name}
                description={role.description}
                accentColor={role.accentColor}
              />
            ))}
          </ul>
        </div>

        <div className="users-avatar-col">
          <img
            src="https://ui-avatars.com/api/?name=Admin+Access&background=0f38ae&color=fff&size=200"
            alt="Access Roles"
            style={{ borderRadius: "50%", boxShadow: "0 10px 25px rgba(15, 56, 110, 0.3)" }}
          />
        </div>
      </div>
    </section>
  );
}
