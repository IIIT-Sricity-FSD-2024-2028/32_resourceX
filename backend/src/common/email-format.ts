import { Role } from './roles';

/** Short role codes used in organization-level account emails. */
export const ROLE_EMAIL_CODES: Partial<Record<Role, string>> = {
  Requestor: 're',
  Registrar: 'rg',
  'System Admin': 'sa',
  'Dept Head': 'dh',
  'Maintenance Officer': 'mo',
  'Inventory Officer': 'io',
  'Procurement Officer': 'po',
};

/** Lowercase letters and digits only: "Acme Corp" -> "acmecorp" */
export function emailSlug(value: string): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Organization-level email: {name}{roleCode}{organizationName}@gmail.com */
export function buildOrgEmail(name: string, role: Role, organizationName: string): string | undefined {
  const code = ROLE_EMAIL_CODES[role];
  if (!code) return undefined;
  return `${emailSlug(name)}${code}${emailSlug(organizationName)}@gmail.com`;
}

/** Returns an error message when the email does not follow the required format, otherwise undefined. */
export function validateOrgEmail(email: string, role: Role, organizationName: string): string | undefined {
  const code = ROLE_EMAIL_CODES[role];
  if (!code) return undefined;
  const suffix = `${code}${emailSlug(organizationName)}@gmail.com`;
  const value = String(email || '').trim().toLowerCase();
  const local = value.slice(0, value.length - suffix.length);
  if (!value.endsWith(suffix) || !/^[a-z0-9]+$/.test(local)) {
    return `Email for ${role} must be in the format {name}${code}${emailSlug(organizationName)}@gmail.com (e.g. ${buildOrgEmail('john', role, organizationName)}).`;
  }
  return undefined;
}

export const EMPLOYEE_EMAIL_PATTERN = /^employee[0-9]+@resourcex\.com$/i;
export const OWNER_EMAIL = 'owner@resourcex.com';
