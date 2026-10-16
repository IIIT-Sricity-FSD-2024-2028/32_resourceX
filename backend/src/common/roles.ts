export const ROLES = [
  'Requestor',
  'Dept Head',
  'Registrar',
  'Inventory Officer',
  'Maintenance Officer',
  'Procurement Officer',
  'System Admin',
  'Owner',
  'Employee',
] as const;

export type Role = (typeof ROLES)[number];

/** Convenience set: all 3 officer sub-roles that replaced the old Staff role */
export const OFFICER_ROLES = ['Inventory Officer', 'Maintenance Officer', 'Procurement Officer'] as const;
export type OfficerRole = (typeof OFFICER_ROLES)[number];

export interface RequestContext {
  role: Role | 'Guest';
  userId?: string;
  organizationId?: string;
}
