import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestsFileLoggerService } from './requests-file-logger';

// The write actions the Requests controller exposes under /:id.
const ALLOWED_ACTIONS = ['approve', 'reject', 'allocate', 'receipt', 'edit', 'cancel'];

// Request ids look like REQ-102 — letters, digits and dashes only.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// Router-level validation middleware for the Requests API (/api/requests).
//
//   GET   /                      — list requests (nothing to validate)
//   POST  /                      — create a new request (body validated by DTO)
//   PATCH /:id                   — update a request
//   POST  /:id/approve           — dept head approves
//   POST  /:id/reject            — dept head rejects
//   POST  /:id/allocate          — staff allocates resources
//   POST  /:id/receipt           — requestor confirms receipt
//   POST  /:id/edit              — requestor edits a pending request
//   POST  /:id/cancel            — requestor cancels before allocation
//
// Approve / reject / allocate / receipt all mutate request state irreversibly,
// so the id and action segment are validated here before the request reaches
// the service. Runs before Nest resolves a controller, so RequestsExceptionFilter
// isn't in scope for anything thrown here — self-logs via reject() so a rejection
// is still captured in requests-error.log either way.
@Injectable()
export class RequestsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: RequestsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Only POST /:id/<action> and PATCH /:id carry a param we need to validate.
    // Plain GET / and POST / (create) don't have a route param.
    if (req.method === 'GET') {
      return next();
    }

    const { requestId, action } = parseRequestsUrl(req);

    // Plain POST / (create a request) — no id segment expected, skip param checks.
    if (!requestId && req.method === 'POST' && !action) {
      return next();
    }

    if (!requestId) {
      this.reject(req, 'Request ID parameter is required.');
    }

    if (!REQUEST_ID_PATTERN.test(requestId as string)) {
      this.reject(
        req,
        `Invalid request id: "${requestId}". Expected letters, digits, dashes or underscores.`,
      );
    }

    // PATCH /:id — no action segment, just id validation above is enough.
    if (req.method === 'PATCH') {
      return next();
    }

    // POST /:id/<action> — validate the action segment.
    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      this.reject(
        req,
        `Invalid request action: "${action ?? ''}". Allowed actions: ${ALLOWED_ACTIONS.join(', ')}.`,
      );
    }

    next();
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

// Middleware runs before route matching, so req.params is empty. Pull the two
// segments out of the URL directly: /api/requests/:id/:action.
function parseRequestsUrl(req: Request): {
  requestId: string | null;
  action: string | null;
} {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('requests');
  if (index === -1) return { requestId: null, action: null };

  const rawId = (parts[index + 1] || '').trim();
  const action = (parts[index + 2] || '').trim() || null;

  const requestId =
    !rawId || rawId === 'undefined' || rawId === 'null'
      ? null
      : rawId;

  return { requestId, action };
}
