import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DepartmentsFileLoggerService } from './departments-file-logger';

const DEPT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

@Injectable()
export class DepartmentsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: DepartmentsFileLoggerService) { }

  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      this.requireText(req, body.name, 'Name', 100);
    }

    if (req.method === 'PATCH' || req.method === 'DELETE') {
      const deptId = extractIdFromUrl(req, 'departments');
      if (!deptId) {
        this.reject(req, 'Department ID parameter is required.');
      }
      if (!DEPT_ID_PATTERN.test(deptId)) {
        this.reject(req, `Invalid Department ID: "${deptId}".`);
      }

      if (req.method === 'PATCH') {
        // At least one field must be present in the body
        if (body.name === undefined && body.head === undefined && body.memberCount === undefined) {
          this.reject(req, 'At least one field (name, head, memberCount) must be provided for update.');
        }
        if (body.name !== undefined) {
          this.requireText(req, body.name, 'Name', 100);
        }
      }
    }

    next();
  }

  private requireText(req: Request, value: unknown, label: string, maxLength: number): void {
    if (typeof value !== 'string' || value.trim() === '') {
      this.reject(req, `${label} is required and cannot be empty.`);
    }
    if ((value as string).length > maxLength) {
      this.reject(req, `${label} must be ${maxLength} characters or fewer.`);
    }
  }

  private reject(req: Request, message: string): never {
    const context = (req as any).context || {};
    this.fileLogger.logError(
      [
        new Date().toISOString(),
        'ERROR',
        req.method,
        req.originalUrl,
        400,
        `role=${context.role || 'unknown'}`,
        `user=${context.userId || 'anonymous'}`,
        message,
      ].join(' | '),
    );
    throw new BadRequestException(message);
  }
}

// req.params is empty in middleware, so read the id from the URL: /api/departments/:id
function extractIdFromUrl(req: Request, segment: string): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf(segment);
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
