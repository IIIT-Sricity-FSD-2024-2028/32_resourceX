import { BadRequestException, Injectable } from '@nestjs/common';
import { DepartmentRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): DepartmentRecord[] {
    const all = this.dataService.getDepartments();
    // Organization isolation — only return departments belonging to the user's org
    if (context.organizationId) {
      return all.filter((d) => d.organizationId === context.organizationId);
    }
    return all;
  }

  create(context: RequestContext, payload: CreateDepartmentDto): DepartmentRecord {
    const orgId = context.organizationId || 'ORG-001';
    const name = payload.name.trim();
    const orgDepts = this.dataService.getDepartments().filter((d) => d.organizationId === orgId);
    if (orgDepts.some((d) => d.name.trim().toLowerCase() === name.toLowerCase())) {
      throw new BadRequestException(`A department named "${name}" already exists.`);
    }
    // Unique, sequential id within the organization (DEPT-001, DEPT-002, ...)
    let seq = orgDepts.length + 1;
    const taken = new Set(orgDepts.map((d) => d.id));
    while (taken.has(`DEPT-${String(seq).padStart(3, '0')}`)) seq += 1;
    const dept: DepartmentRecord = {
      id: `DEPT-${String(seq).padStart(3, '0')}`,
      organizationId: orgId,
      name,
      head: '',
      memberCount: payload.memberCount || 0
    };
    return this.dataService.insertDepartment(dept);
  }

  update(id: string, payload: UpdateDepartmentDto): DepartmentRecord {
    return this.dataService.updateDepartment(id, payload);
  }

  remove(id: string): DepartmentRecord {
    return this.dataService.deleteDepartment(id);
  }
}
