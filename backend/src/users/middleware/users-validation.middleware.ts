import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ROLES } from '../../common/roles';
import { UsersFileLoggerService } from './users-file-logger';

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class UsersValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: UsersFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      const url = (req.originalUrl || req.url || '').split('?')[0];
      const isCreateEmployee = url.endsWith('/create-employee');
      // Bulk imports carry many rows; the service validates each row and reports failures per row
      const isBulkImport = url.endsWith('/bulk');

      if (isBulkImport) {
        if (!Array.isArray(body.rows)) {
          this.reject(req, 'rows must be an array of user rows.');
        }
      } else if (isCreateEmployee) {
        this.requireText(req, body.name, 'Name', 100);
        this.requireEmail(req, body.email);
      } else {
        // Standard user creation
        this.requireUserId(req, body.id);
        this.requireText(req, body.name, 'Name', 100);
        this.requireEmail(req, body.email);

        if (typeof body.password !== 'string' || body.password.length < 8) {
          this.reject(req, 'Password must be a string and at least 8 characters long.');
        }

        const role = typeof body.role === 'string' ? body.role.trim() : '';
        const matchedRole = ROLES.find(
          (allowed) => allowed.toLowerCase() === role.toLowerCase(),
        );
        if (!matchedRole) {
          this.reject(
            req,
            `Invalid role: "${body.role ?? ''}". Allowed values: ${ROLES.join(', ')}.`,
          );
        }
        body.role = matchedRole;
      }
    }

    if (req.method === 'PATCH' || req.method === 'DELETE') {
      const userId = extractUserIdFromUrl(req);
      if (!userId) {
        this.reject(req, 'User ID parameter is required.');
      }
      if (!USER_ID_PATTERN.test(userId)) {
        this.reject(req, `Invalid User ID: "${userId}".`);
      }
    }

    next();
  }

  private requireText(req: Request, value: unknown, label: string, maxLength: number): void {
    if (typeof value !== 'string' || value.trim() === '') {
      this.reject(req, `${label} is required and cannot be empty.`);
    }
    if (value.length > maxLength) {
      this.reject(req, `${label} must be ${maxLength} characters or fewer.`);
    }
  }

  private requireEmail(req: Request, value: unknown): void {
    if (typeof value !== 'string' || !EMAIL_PATTERN.test(value)) {
      this.reject(req, 'A valid email address is required.');
    }
  }

  private requireUserId(req: Request, value: unknown): void {
    if (typeof value !== 'string' || !USER_ID_PATTERN.test(value)) {
      this.reject(req, 'ID is required and must contain alphanumeric characters, dashes, or underscores only.');
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

// req.params is empty in middleware, so read the id from the URL: /api/users/:id
function extractUserIdFromUrl(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('users');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  // ignore auxiliary endpoints
  if (!id || id === 'undefined' || id === 'null' || id === 'mock') return null;
  return id;
}
