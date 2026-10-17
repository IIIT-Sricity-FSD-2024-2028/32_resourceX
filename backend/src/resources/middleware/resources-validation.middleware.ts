import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ResourcesFileLoggerService } from './resources-file-logger';

const RESOURCE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

@Injectable()
export class ResourcesValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: ResourcesFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const url = (req.originalUrl || req.url || '').split('?')[0];
    const body = req.body || {};

    if (req.method === 'POST') {
      // Action sub-routes on an existing resource — no body validation needed here.
      const isActionRoute =
        url.includes('/maintenance-request') ||
        url.includes('/initiate-return') ||
        url.includes('/confirm-repaired') ||
        url.includes('/scrap') ||
        url.includes('/request-extension') ||
        url.includes('/approve-extension') ||
        url.includes('/reject-extension');

      if (!isActionRoute) {
        const isCatalogUpdate = url.endsWith('/catalog');

        if (isCatalogUpdate) {
          // catalog update: requires department (string) and types (non-empty array)
          this.requireText(req, body.department, 'Department', 100);
          if (!Array.isArray(body.resourceTypes) || body.resourceTypes.length === 0) {
            this.reject(req, 'resourceTypes must be a non-empty array.');
          }
        } else {
          // standard resource creation
          this.requireText(req, body.id, 'Resource ID', 64);
          if (!RESOURCE_ID_PATTERN.test(body.id)) {
            this.reject(req, 'Resource ID must contain alphanumeric characters, dashes, or underscores only.');
          }
          this.requireText(req, body.type, 'Type', 100);
          this.requireText(req, body.department, 'Department', 100);
        }
      }
    }

    if (req.method === 'PATCH') {
      const resourceId = extractIdFromUrl(req, 'resources');
      if (!resourceId) {
        this.reject(req, 'Resource ID parameter is required.');
      }
      if (!RESOURCE_ID_PATTERN.test(resourceId)) {
        this.reject(req, `Invalid Resource ID: "${resourceId}".`);
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

// req.params is empty in middleware, so read the id from the URL: /api/resources/:id
function extractIdFromUrl(req: Request, segment: string): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf(segment);
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
