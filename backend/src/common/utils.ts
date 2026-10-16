import { BadRequestException } from '@nestjs/common';
import { RequestContext } from './roles';
import { DataService } from '../data/data.service';

export function getActingUser(dataService: DataService, context: RequestContext) {
  if (!context.userId) {
    return undefined;
  }
  return dataService.getUserById(context.userId);
}

export function ensureActor(dataService: DataService, context: RequestContext) {
  const user = getActingUser(dataService, context);
  if (!user) {
    throw new BadRequestException('A valid x-user-id header is required for this action.');
  }
  return user;
}

export function ensureDepartmentScoped(dataService: DataService, context: RequestContext, department?: string) {
  const officerRoles = ['Inventory Officer', 'Maintenance Officer', 'Procurement Officer'];
  if (context.role !== 'Dept Head' && !officerRoles.includes(context.role as string)) {
    return;
  }
  const user = getActingUser(dataService, context);
  if (!user || user.department !== department) {
    throw new BadRequestException('Action is restricted to your department.');
  }
}

export function normalizeResourceToken(value?: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function resourceMatchesType(resource: { type?: string; name?: string }, requestedType: string): boolean {
  if (!requestedType || !resource) return false;
  const target = normalizeResourceToken(requestedType);
  const resType = normalizeResourceToken(resource.type);
  if (!target || !resType) return false;

  if (target === resType) return true;
  // Handle plural / singular variation (e.g. laptop vs laptops, server blade vs server blades)
  const stripS = (str: string) => (str.endsWith('s') ? str.slice(0, -1) : str);
  if (stripS(target) === stripS(resType)) return true;
  // Handle internal plural variation (e.g. serversblade vs serverblade)
  if (target.replace(/s/g, '') === resType.replace(/s/g, '')) return true;

  return false;
}

export function getDepartmentResourceTypes(dataService: DataService, department: string, organizationId?: string): string[] {
  const entry = dataService.getResourceCatalog().find(
    (item) => item.department === department && (!organizationId || item.organizationId === organizationId)
  );
  return entry ? [...entry.resourceTypes] : [];
}

export function ensureValidDepartmentResourceType(dataService: DataService, department: string, resourceType: string, organizationId?: string) {
  const allowedTypes = getDepartmentResourceTypes(dataService, department, organizationId);
  if (allowedTypes.length === 0) {
    throw new BadRequestException(
      `Resource catalog configuration is missing for department "${department}". Please configure it before performing this action.`,
    );
  }

  const isValid = allowedTypes.some((allowed) => resourceMatchesType({ type: allowed }, resourceType));

  if (!isValid) {
    throw new BadRequestException(
      `Resource type "${resourceType}" is not configured for department "${department}".`,
    );
  }
}
